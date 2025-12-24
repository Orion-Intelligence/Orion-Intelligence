import asyncio

from fastapi import HTTPException

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
