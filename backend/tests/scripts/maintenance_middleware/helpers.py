import asyncio


def _run(coro):
    return asyncio.run(coro)


def _drive(app, scope, incoming=None):
    sent = []

    async def receive():
        return incoming or {"type": "http.request"}

    async def send(message):
        sent.append(message)

    _run(app(scope, receive, send))
    return sent


def _status_of(sent):
    for message in sent:
        if message.get("type") == "http.response.start":
            return message.get("status")
    return None
