import asyncio
from typing import List, Dict, Any, Optional

from elasticsearch import AsyncElasticsearch

from orion.helper_manager.env_handler import env_handler
from orion.services.log_manager.log_controller import log
from orion.services.elastic_manager.elastic_enums import ELASTIC_KEYS, ELASTIC_SEMANTIC, ELASTIC_SEMANTIC_INDEX


class elastic_semantic_controller:
    __instance: Optional["elastic_semantic_controller"] = None
    __m_connection: Optional[AsyncElasticsearch] = None
    __indices: List[str] = []
    __embed_model = None
    __embed_model_name = "intfloat/multilingual-e5-small"

    @staticmethod
    def get_instance() -> "elastic_semantic_controller":
        if elastic_semantic_controller.__instance is None:
            elastic_semantic_controller()
        return elastic_semantic_controller.__instance

    def __init__(self) -> None:
        elastic_semantic_controller.__instance = self

    async def init(self, connection: AsyncElasticsearch, indices: Optional[List[str]] = None) -> None:
        if env_handler.get_instance().env("SEMANTIC_ENABLED") == "1":
            self.__m_connection = connection
            self.__indices = indices if indices else self.__collect_indices()
            await self.__post_init_semantic()
            self.__load_model_sync()

    def get_connection(self) -> AsyncElasticsearch:
        return self.__m_connection

    async def close(self) -> None:
        try:
            if self.__m_connection:
                await self.__m_connection.close()
        except Exception as ex:
            log.g().w(f"ES close warning: {str(ex)}")

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

    def __load_model_sync(self):
        if self.__embed_model is None:
            try:
                from sentence_transformers import SentenceTransformer
            except Exception as ex:
                log.g().e(f"sentence-transformers not available: {str(ex)}")
                raise
            self.__embed_model = SentenceTransformer(self.__embed_model_name)

    async def __embed_texts(self, texts: List[str], input_type: str = "INGEST") -> List[List[float]]:
        try:
            vecs = await asyncio.to_thread(self.__embed_model.encode, texts, normalize_embeddings=True)
            return vecs.tolist() if hasattr(vecs, "tolist") else [v for v in vecs]
        except Exception as ex:
            log.g().e(f"Embedding failed: {str(ex)}")
            return []

    async def embed_query(self, text: str) -> Optional[List[float]]:
        try:
            q = ("query: " + (text or "").strip())
            out = await self.__embed_texts([q], input_type="QUERY")
            return out[0] if out else None
        except Exception as ex:
            log.g().e(f"Query embedding failed: {str(ex)}")
            return None

    def embed_query_sync(self, text: str) -> Optional[List[float]]:
        try:
            q = ("query: " + (text or "").strip())
            vec = self.__embed_model.encode([q], normalize_embeddings=True)
            if hasattr(vec, "tolist"):
                lst = vec.tolist()
                return lst[0] if lst else None
            return vec[0] if isinstance(vec, list) and vec else None
        except Exception as ex:
            log.g().e(f"Query embedding (sync) failed: {str(ex)}")
            return None

    async def enrich_for_semantic(self, p_data: Any) -> Any:
        if env_handler.get_instance().env("SEMANTIC_ENABLED") == "0":
            return p_data

        async def compute_vec(doc: Dict[str, Any]) -> Optional[List[float]]:
            title = (doc.get("m_title") or "").strip()
            important = (doc.get("m_important_content") or "").strip()
            content = (doc.get("m_content") or "").strip()
            text = "\n".join([t for t in (title, important, content) if t]).strip()
            if not text:
                return None
            vecs = await self.__embed_texts([f"passage: {text}"], input_type="INGEST")
            return vecs[0] if vecs else None

        if isinstance(p_data, list):
            out = []
            for entry in p_data:
                doc = entry.get(ELASTIC_KEYS.S_VALUE, {})
                try:
                    vec = await compute_vec(doc)
                    if vec:
                        doc[ELASTIC_SEMANTIC.S_EMBED_FIELD] = vec
                except Exception as ex:
                    log.g().w(f"Embedding skipped (batch item): {str(ex)}")
                entry[ELASTIC_KEYS.S_VALUE] = doc
                out.append(entry)
            return out
        else:
            entry = p_data
            doc = entry.get(ELASTIC_KEYS.S_VALUE, {})
            try:
                vec = await compute_vec(doc)
                if vec:
                    doc[ELASTIC_SEMANTIC.S_EMBED_FIELD] = vec
            except Exception as ex:
                log.g().w(f"Embedding skipped (single item): {str(ex)}")
            entry[ELASTIC_KEYS.S_VALUE] = doc
            return entry
