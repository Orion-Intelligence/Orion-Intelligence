import asyncio
import hashlib
import math
import time
from fastapi import HTTPException

from orion.services.redis_manager.redis_controller import redis_controller
from orion.services.redis_manager.redis_enums import REDIS_COMMANDS

MAX_CONCURRENT_REQUESTS = 15
MAX_QUEUE_SIZE = 50

semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)
queue = asyncio.Queue(MAX_QUEUE_SIZE)


async def limiter_dependency():
    try:
        await asyncio.wait_for(queue.put(None), timeout=0.1)
    except asyncio.TimeoutError:
        raise HTTPException(status_code=429, detail="Too many requests, queue full")

    try:
        async with semaphore:
            yield
    finally:
        queue.get_nowait()
        queue.task_done()


async def auth_rate_limit(redis_store: redis_controller, subject: str, login_call):
    subject_hash = hashlib.sha256(subject.lower().encode()).hexdigest()
    failures_key = f"auth:login:failures:{subject_hash}"
    retry_key = f"auth:login:retry:{subject_hash}"
    retry_at = int(
        await redis_store.invoke_trigger(
            REDIS_COMMANDS.S_GET_STRING, [retry_key, None, None]
        ) or 0
    )
    if retry_at > time.time():
        retry_after = math.ceil(retry_at - time.time())
        raise HTTPException(
            status_code=429,
            detail=f"Too many login attempts. Try again in {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)},
        )

    failures = int(
        await redis_store.invoke_trigger(
            REDIS_COMMANDS.S_GET_INT, [failures_key, 0, 30 * 60]
        )
    )

    try:
        result = await login_call()
    except HTTPException as error:
        if error.status_code < 500:
            failures += 1
            await redis_store.invoke_trigger(
                REDIS_COMMANDS.S_SET_INT, [failures_key, failures, 30 * 60]
            )
            if failures >= 5:
                delay = (60, 10 * 60, 30 * 60)[min(failures - 5, 2)]
                await redis_store.invoke_trigger(
                    REDIS_COMMANDS.S_SET_STRING,
                    [retry_key, str(int(time.time() + delay)), delay],
                )
                raise HTTPException(
                    status_code=429,
                    detail=f"Too many login attempts. Try again in {delay} seconds.",
                    headers={"Retry-After": str(delay)},
                )
        raise

    await redis_store.invoke_trigger(REDIS_COMMANDS.S_DELETE_KEY, [failures_key])
    await redis_store.invoke_trigger(REDIS_COMMANDS.S_DELETE_KEY, [retry_key])
    return result
