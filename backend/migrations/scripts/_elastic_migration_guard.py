TRANSIENT_INDEX_ERROR_MARKERS = (
    "no search context found",
    "search_context_missing_exception",
    "index_not_found_exception",
    "no such index",
)


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
