import asyncio

from elastic_transport import ApiError

try:
    from orion.services.log_manager.log_controller import log
except ImportError:
    log = None


TRANSIENT_INDEX_ERROR_MARKERS = (
    "no search context found",
    "search_context_missing_exception",
    "index_not_found_exception",
    "no such index",
)


def _report(message):
    if log is not None:
        log.g().i(message)
    else:
        print(message, flush=True)


def elastic_status_code(ex):
    return getattr(ex, "status_code", None) or getattr(getattr(ex, "meta", None), "status", None)


def should_skip_elastic_index_error(ex):
    status_code = elastic_status_code(ex)
    if status_code == 503:
        return True
    if status_code != 404:
        return False

    message = str(ex).lower()
    return any(marker in message for marker in TRANSIENT_INDEX_ERROR_MARKERS)


def short_elastic_error(ex):
    return str(ex)[:500]


async def run_update_by_query_with_progress(es, index, body, label, poll_interval=5, request_timeout=220):
    for attempt in range(2):
        try:
            submit = await es.update_by_query(
                index=index,
                body=body,
                allow_no_indices=True,
                conflicts="proceed",
                ignore_unavailable=True,
                wait_for_completion=False,
                request_timeout=request_timeout,
            )
            task_id = submit.get("task") if hasattr(submit, "get") else submit["task"]
            if not task_id:
                _report(f"MIGRATION {label}: nothing to update on '{index}'")
                return submit

            _report(f"MIGRATION {label}: started update_by_query on '{index}' (task {task_id})")
            while True:
                try:
                    status = await es.tasks.get(task_id=task_id)
                except ApiError as ex:
                    if elastic_status_code(ex) == 404:
                        _report(f"MIGRATION {label}: task {task_id} already completed and reaped on '{index}'")
                        break
                    raise
                task_status = (status.get("task") or {}).get("status") or {}
                total = task_status.get("total", 0) or 0
                processed = sum(task_status.get(key, 0) or 0 for key in ("updated", "created", "deleted", "noops"))
                if status.get("completed", False):
                    _report(f"MIGRATION {label}: finished on '{index}' ({processed}/{total} documents)")
                    break
                _report(f"MIGRATION {label}: in progress on '{index}' ({processed}/{total} documents)")
                await asyncio.sleep(poll_interval)

            await es.indices.refresh(index=index, ignore_unavailable=True)
            return status
        except ApiError as ex:
            if not should_skip_elastic_index_error(ex):
                raise
            short_message = short_elastic_error(ex)
            if attempt == 0:
                _report(f"MIGRATION {label}: retrying update_by_query on '{index}': {short_message}")
                continue
            _report(f"MIGRATION {label}: skipping unavailable index '{index}': {short_message}")
            return None
