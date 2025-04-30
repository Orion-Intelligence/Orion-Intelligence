from fastapi import APIRouter
from elasticsearch import Elasticsearch
import uuid
import random

test_router = APIRouter()

es = Elasticsearch("http://localhost:9400")

index_name = "test-messages"
@test_router.post("/api/test/save")
async def saveMessages():
    try:
        message = {
            "message": "Hello from Elasticsearch!",
            "id": str(uuid.uuid4())
        }

        res = es.index(index=index_name, document=message)
        return {"status": "saved", "data": res}

    except Exception as e:
        print("Save Error:", e)
        return {"error": str(e)}


@test_router.get("/api/test/search")
async def searchMessages():
    try:
        query = {
            "query": {
                "match_all": {}
            }
        }
        res = es.search(index=index_name, body=query)
        return {"hits": res["hits"]["hits"]}
    except Exception as e:
        print("Search Error:", e)
        return {"error": str(e)}


messages = [
    "Hello World!",
    "Hi there 👋",
    "Welcome aboard 🚀",
    "Howdy, partner 🤠",
    "Greetings from the API 😎",
    "Have a great day 🌞",
    "You hit the test endpoint 🧪",
    "API says hello again!",
    "Randomness is fun 🎲"
]
@test_router.get("/api/test/text")
async def test_hello():
    return {"message": random.choice(messages)}
