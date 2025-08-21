import httpx

from typing import List, Dict, Any, Optional
from elasticsearch import AsyncElasticsearch
from orion.helper_manager.env_handler import env_handler
from orion.services.log_manager.log_controller import log
from orion.services.elastic_manager.elastic_enums import ELASTIC_KEYS, ELASTIC_SEMANTIC, ELASTIC_SEMANTIC_INDEX


class elastic_semantic_controller:
    __instance: Optional["elastic_semantic_controller"] = None
    __m_connection: Optional[AsyncElasticsearch] = None
    __indices: List[str] = []

    @staticmethod
    def get_instance() -> "elastic_semantic_controller":
        if elastic_semantic_controller.__instance is None:
            elastic_semantic_controller()
        return elastic_semantic_controller.__instance

    def __init__(self) -> None:
        elastic_semantic_controller.__instance = self

    async def init(self, connection: AsyncElasticsearch, indices: Optional[List[str]] = None) -> None:
        self.__m_connection = connection
        self.__indices = indices if indices else self.__collect_indices()
        await self.__post_init_semantic()

    def get_connection(self) -> AsyncElasticsearch:
        return self.__m_connection

    async def close(self) -> None:
        try:
            if self.__m_connection:
                await self.__m_connection.close()
        except Exception as ex:
            log.g().w(f"ES close warning: {str(ex)}")
            raise

    @staticmethod
    def __collect_indices() -> List[str]:
        return [v for k, v in ELASTIC_SEMANTIC_INDEX.__dict__.items() if isinstance(v, str) and not k.startswith("__")]

    async def __post_init_semantic(self) -> None:
        for idx in self.__indices:
            await self.__ensure_vector_field(idx)

    async def __ensure_vector_field(self, index_name: str) -> None:
        try:
            mapping = await self.__m_connection.indices.get_mapping(index=index_name)
            props = mapping.get(index_name, {}).get("mappings", {}).get("properties", {})
            if ELASTIC_SEMANTIC.S_EMBED_FIELD in props:
                return
            await self.__m_connection.indices.put_mapping(
                index=index_name,
                body={
                    "properties": {
                        ELASTIC_SEMANTIC.S_EMBED_FIELD: {
                            "type": "dense_vector",
                            "dims": ELASTIC_SEMANTIC.S_EMBED_DIMS,
                            "similarity": "cosine",
                            "index": True
                        }
                    }
                }
            )
        except Exception as ex:
            log.g().e(f"Failed to add vector field on {index_name}: {str(ex)}")
            raise

    @staticmethod
    async def __embed_texts(texts: List[str]) -> List[List[float]]:
        base = env_handler.get_instance().env("EMBED_API_BASE") or "http://trusted-micros-api:8010"
        try:
            async with httpx.AsyncClient(timeout=200) as client:
                r = await client.post(f"{base}/nlp/embed/index", json={"data": texts, "normalize": True})
                r.raise_for_status()
                data = r.json()
                payload = data.get("result", data) or {}
                if not payload:
                    raise ValueError("Empty embedding payload")
                embs = payload.get("embeddings") or []
                if not embs:
                    raise ValueError("No embeddings in payload")
                return embs
        except Exception as ex:
            log.g().e(f"Embedding failed: {str(ex)}")
            raise

    async def embed_query(self, text: str) -> Optional[List[float]]:
        try:
            q = ("query: " + (text or "").strip())
            out = await self.__embed_texts([q])
            return out[0] if out else None
        except Exception as ex:
            log.g().e(f"Query embedding failed: {str(ex)}")
            raise

    @staticmethod
    def embed_query_sync(text: str) -> Optional[List[float]]:
        base = "http://trusted-micros-api:8010"
        try:
            q = ("query: " + (text or "").strip())
            with httpx.Client(timeout=200) as client:
                r = client.post(f"{base}/nlp/embed", json={"data": [q], "normalize": True})
                r.raise_for_status()
                data = r.json()
                payload = data.get("result", data) or {}
                if not payload:
                    raise ValueError("Empty embedding payload")
                embs = payload.get("embeddings")
                if isinstance(embs, list) and embs:
                    first = embs[0]
                    return first if isinstance(first, list) else None
                emb = payload.get("embedding")
                if isinstance(emb, list) and emb:
                    return emb
                raise ValueError(f"No embeddings in payload: {data}")
        except Exception as ex:
            log.g().e(f"Query embedding (sync) failed: {str(ex)}")
            raise

    async def compute_vec(self, doc: Dict[str, Any]) -> Optional[List[float]]:
        title = (doc.get("m_title") or "").strip()
        important = (doc.get("m_important_content") or "").strip()
        content = (doc.get("m_content") or "").strip()
        text = "\n".join([t for t in (title, important, content) if t]).strip()
        if not text:
            return None
        vecs = await self.__embed_texts([f"passage: {text}"])
        return vecs[0] if vecs else None

    async def enrich_for_semantic(self, p_data: Any) -> Any:
        if isinstance(p_data, list):
            out = []
            for entry in p_data:
                doc = entry.get(ELASTIC_KEYS.S_VALUE, {})
                try:
                    vec = await self.compute_vec(doc)
                    if vec:
                        doc[ELASTIC_SEMANTIC.S_EMBED_FIELD] = vec
                except Exception as ex:
                    log.g().w(f"Embedding skipped (batch item): {str(ex)}")
                    raise
                entry[ELASTIC_KEYS.S_VALUE] = doc
                out.append(entry)
            return out
        else:
            entry = p_data
            doc = entry.get(ELASTIC_KEYS.S_VALUE, {})
            try:
                vec = await self.compute_vec(doc)
                if vec:
                    doc[ELASTIC_SEMANTIC.S_EMBED_FIELD] = vec
            except Exception as ex:
                log.g().w(f"Embedding skipped (single item): {str(ex)}")
                raise
            entry[ELASTIC_KEYS.S_VALUE] = doc
            return entry
