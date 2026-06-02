import re
from typing import Any

import httpx
from fastapi import HTTPException

from orion.helper_manager.env_handler import env_handler


class HistoryEmbeddingManager:
    CHAT_HISTORY_LIMIT = 50
    SEMANTIC_TURN_LIMIT = 6
    RECENT_TURN_LIMIT = 2
    TURN_LIMIT = SEMANTIC_TURN_LIMIT + RECENT_TURN_LIMIT
    EMBED_FIELD = "m_embedding"

    @staticmethod
    def _as_dict(value: Any) -> dict[str, Any]:
        if isinstance(value, dict):
            return value
        if hasattr(value, "model_dump"):
            return value.model_dump()
        if hasattr(value, "dict"):
            return value.dict()
        return {}

    @classmethod
    def strip_embeddings(cls, history: list[dict[str, Any]]) -> list[dict[str, Any]]:
        stripped_history = []
        for item in history:
            message = cls._as_dict(item)
            if message:
                stripped_history.append({key: value for key, value in message.items() if key != cls.EMBED_FIELD})
        return stripped_history

    @staticmethod
    def _history_key(message: dict[str, Any]) -> tuple[str, str, str]:
        return (
            str(message.get("sender") or ""),
            str(message.get("text") or ""),
            str(message.get("time") or ""),
        )

    @classmethod
    def _normalize_embedding(cls, value: Any) -> list[float]:
        if not isinstance(value, list) or not value:
            return []
        try:
            return [float(item) for item in value]
        except (TypeError, ValueError):
            return []

    @classmethod
    def _existing_embeddings(cls, history: list[dict[str, Any]]) -> dict[tuple[str, str, str], list[float]]:
        embeddings: dict[tuple[str, str, str], list[float]] = {}
        for item in history or []:
            message = cls._as_dict(item)
            if not message:
                continue
            embedding = cls._normalize_embedding(message.get(cls.EMBED_FIELD))
            if embedding:
                embeddings[cls._history_key(message)] = embedding
        return embeddings

    @staticmethod
    async def _embed_texts(texts: list[str]) -> list[list[float]]:
        base = env_handler.get_instance().env("EMBED_API_BASE") or "http://trusted-micros-api:8010"
        try:
            async with httpx.AsyncClient(timeout=200) as client:
                response = await client.post(f"{base}/nlp/embed/index", json={"data": texts, "normalize": True})
                response.raise_for_status()
                data = response.json()
                payload = data.get("result", data) or {}
                embeddings = payload.get("embeddings") or []
        except Exception as exc:
            raise HTTPException(status_code=503, detail="Failed to embed chat history") from exc

        if not embeddings:
            raise HTTPException(status_code=503, detail="Failed to embed chat history")
        return embeddings

    @classmethod
    async def _embed_passages(cls, texts: list[str]) -> list[list[float]]:
        embeddings = await cls._embed_texts([f"passage: {text}" for text in texts])
        normalized = [cls._normalize_embedding(embedding) for embedding in embeddings]
        if len(normalized) != len(texts) or any(text.strip() and not embedding for text, embedding in zip(texts, normalized)):
            raise HTTPException(status_code=503, detail="Failed to embed chat history")
        return normalized

    @staticmethod
    def _message_user_name(message: dict[str, Any], user_name: str) -> str:
        explicit_name = message.get("user_name") or message.get("userName")
        if explicit_name:
            return str(explicit_name)
        sender = str(message.get("sender") or "")
        if sender == "user":
            return user_name
        if sender == "bot":
            return "nexus"
        return sender or user_name

    @classmethod
    def _message_for_storage(cls, message: dict[str, Any], user_name: str) -> dict[str, Any]:
        return {
            "sender": str(message.get("sender") or ""),
            "user_name": cls._message_user_name(message, user_name),
            "time": str(message.get("time") or ""),
            "text": str(message.get("text") or ""),
            cls.EMBED_FIELD: cls._normalize_embedding(message.get(cls.EMBED_FIELD)),
        }

    @classmethod
    async def prepare_for_storage(
        cls,
        chat_history,
        existing_history: list[dict[str, Any]],
        user_name: str = "",
    ) -> list[dict[str, Any]]:
        raw_history = [
            cls._message_for_storage(cls._as_dict(message), user_name)
            for message in chat_history.chat_history
        ]
        capped_history = raw_history[-cls.CHAT_HISTORY_LIMIT:]
        existing_embeddings = cls._existing_embeddings(existing_history)

        missing_indices: list[int] = []
        missing_texts: list[str] = []
        for index, message in enumerate(capped_history):
            embedding = existing_embeddings.get(cls._history_key(message)) or cls._normalize_embedding(
                message.get(cls.EMBED_FIELD)
            )
            if embedding:
                message[cls.EMBED_FIELD] = embedding
                continue

            text = str(message.get("text") or "").strip()
            message[cls.EMBED_FIELD] = []
            if text:
                missing_indices.append(index)
                missing_texts.append(text)

        if missing_texts:
            embeddings = await cls._embed_passages(missing_texts)
            for index, embedding in zip(missing_indices, embeddings):
                capped_history[index][cls.EMBED_FIELD] = embedding

        return capped_history

    @staticmethod
    def _clean_text(value: Any) -> str:
        return re.sub(r"\s+", " ", str(value or "")).strip()[:2000]

    @staticmethod
    def _cosine_similarity(left: list[float], right: list[float]) -> float:
        if not left or not right or len(left) != len(right):
            return 0.0
        dot = sum(a * b for a, b in zip(left, right))
        left_norm = sum(a * a for a in left) ** 0.5
        right_norm = sum(b * b for b in right) ** 0.5
        if not left_norm or not right_norm:
            return 0.0
        return dot / (left_norm * right_norm)

    @classmethod
    def _build_turns(cls, history: list[dict[str, Any]], limit: int | None = None) -> list[dict[str, Any]]:
        turns: list[dict[str, Any]] = []
        pending_message = ""
        pending_embedding: list[float] = []

        for raw_item in history:
            item = cls._as_dict(raw_item)
            if not item:
                continue
            sender = item.get("sender")
            if sender == "user":
                pending_message = cls._clean_text(item.get("text"))
                pending_embedding = cls._normalize_embedding(item.get(cls.EMBED_FIELD))
                continue
            if sender == "bot" and pending_message:
                response = cls._clean_text(item.get("text"))
                if response:
                    turn: dict[str, Any] = {"message": pending_message, "response": response}
                    response_embedding = cls._normalize_embedding(item.get(cls.EMBED_FIELD))
                    if pending_embedding:
                        turn["message_embedding"] = pending_embedding
                    if response_embedding:
                        turn["response_embedding"] = response_embedding
                    turns.append(turn)
                pending_message = ""
                pending_embedding = []

        return turns[-limit:] if limit is not None else turns

    @staticmethod
    def _strip_turn_embeddings(turns: list[dict[str, Any]]) -> list[dict[str, str]]:
        return [
            {"message": str(turn.get("message") or ""), "response": str(turn.get("response") or "")}
            for turn in turns
            if turn.get("message") and turn.get("response")
        ]

    @classmethod
    async def _embed_query(cls, prompt: str) -> list[float]:
        if not prompt.strip():
            return []
        try:
            embeddings = await cls._embed_texts([f"query: {prompt.strip()}"])
            embedding = embeddings[0] if embeddings else []
            return cls._normalize_embedding(embedding)
        except Exception:
            return []

    @classmethod
    async def select_turns(cls, prompt: str, history: list[dict[str, Any]], limit: int = TURN_LIMIT) -> list[dict[str, str]]:
        turns = cls._build_turns(history)
        if len(turns) <= limit:
            return cls._strip_turn_embeddings(turns)

        query_embedding = await cls._embed_query(prompt)
        if not query_embedding:
            return cls._strip_turn_embeddings(turns[-limit:])

        recent_count = min(cls.RECENT_TURN_LIMIT, limit)
        recent_start = max(0, len(turns) - recent_count)
        selected_indexes = set(range(recent_start, len(turns)))
        remaining_slots = min(cls.SEMANTIC_TURN_LIMIT, max(0, limit - len(selected_indexes)))

        scored_indexes: list[tuple[float, int]] = []
        for index, turn in enumerate(turns[:recent_start]):
            score = max(
                cls._cosine_similarity(query_embedding, turn.get("message_embedding") or []),
                cls._cosine_similarity(query_embedding, turn.get("response_embedding") or []),
            )
            if score > 0:
                scored_indexes.append((score, index))

        for _, index in sorted(scored_indexes, reverse=True)[:remaining_slots]:
            selected_indexes.add(index)

        if len(selected_indexes) < limit:
            for index in range(len(turns) - 1, -1, -1):
                selected_indexes.add(index)
                if len(selected_indexes) >= limit:
                    break

        return cls._strip_turn_embeddings([turns[index] for index in sorted(selected_indexes)])
