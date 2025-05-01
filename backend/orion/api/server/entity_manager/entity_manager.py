import re

from orion.api.server.entity_manager.modal.EntityQueryModel import EntityQueryModel
from orion.services.arango_manager.arango_controller import arango_controller
from orion.services.log_manager.log_controller import log
from fastapi.concurrency import run_in_threadpool
from orion.api.server.crawl_manager.class_model.entity_model import entity_model

class entity_manager:
    __instance = None
    __db = None
    __graph = None

    @staticmethod
    def get_instance():
        if entity_manager.__instance is None:
            entity_manager()
        return entity_manager.__instance

    def __init__(self):
        if entity_manager.__instance is not None:
            raise Exception("This class is a singleton!")
        entity_manager.__instance = self
        arango = arango_controller.get_instance()
        self.__db = arango.get_db()
        self.__graph = arango.get_graph()

    @staticmethod
    def _normalize_key(text: str) -> str:
        if not isinstance(text, str):
            text = str(text)
        return text.lower().replace(" ", "_")

    @staticmethod
    def _sanitize(value: str) -> str:
        return re.sub(r'[^a-zA-Z0-9_\-\.@()+,=;\$!\*\'%:]', '', value.replace(' ', '_')).lower()

    async def get_entity_relations(self, query: EntityQueryModel):
        try:
            normalized_value = self._sanitize(self._normalize_key(query.query_value))
            normalized_type = self._sanitize(self._normalize_key(query.model_type)) if query.model_type else None

            base_types = ["m_email_addresses", "m_phone_numbers", "m_states", "m_location_info", "m_social_media_profiles", "m_name", "m_industry", "m_company_name", "m_country_name", "m_ip", "m_team", "m_attacker", "m_au_abn", "m_au_acn", "m_au_medicare", "m_au_tfn", "m_credit_cards",
                          "m_crypto_addresses", "m_crypto_btc_addresses", "m_iban_codes", "m_in_aadhaar_numbers", "m_in_pan_numbers", "m_in_passport_numbers", "m_in_vehicle_registrations", "m_in_voter_ids", "m_medical_licenses", "m_nrp_numbers", "m_persons", "m_sg_nric_fin_numbers",
                          "m_uk_nhs_numbers", "m_uk_nino_numbers", "m_urls", "m_us_bank_numbers", "m_us_driver_licenses", "m_us_itin_numbers", "m_us_passport_numbers", "m_us_ssn_numbers"  "m_title", "m_url", "m_weblink", "m_dumplink", "m_websites"]

            query_str = ""
            bind_vars = {}

            if query.data_point_type == "cluster" and normalized_type == "cluster":
                if normalized_value == "all":
                    query_str = "FOR cluster IN cti_vertices FILTER cluster.type == 'cluster' AND cluster._key IN ['general','leak','defacement','chat'] FOR v,e,p IN 1..2 ANY cluster._id GRAPH 'cti_graph' RETURN {vertex: v, edge: e, path: p}"
                else:
                    query_str = "FOR v,e,p IN 1..2 ANY @cluster_id GRAPH 'cti_graph' RETURN {vertex: v, edge: e, path: p}"
                    bind_vars = {"cluster_id": f"cti_vertices/{normalized_value}"}

            elif query.data_point_type == "property" and normalized_type == "all":
                if normalized_value == "all":
                    query_str = f"FOR property IN cti_vertices FILTER property.type IN {base_types} FOR v,e,p IN 1..2 ANY property._id GRAPH 'cti_graph' RETURN {{vertex: v, edge: e, path: p}}"
                else:
                    query_str = f"FOR property IN cti_vertices FILTER property.type IN {base_types} AND CONTAINS(LOWER(property.value), @search_value) FOR v,e,p IN 1..2 ANY property._id GRAPH 'cti_graph' RETURN {{vertex: v, edge: e, path: p}}"
                    bind_vars = {"search_value": normalized_value}

            else:
                start_vertex = f"cti_vertices/{normalized_value}" if query.data_point_type == "document" else f"cti_vertices/{normalized_type}:{normalized_value}"
                query_str = "FOR v,e,p IN 1..2 ANY @start_vertex GRAPH 'cti_graph' RETURN {vertex: v, edge: e, path: p}"
                bind_vars = {"start_vertex": start_vertex}

            results = await run_in_threadpool(lambda: list(self.__db.aql.execute(query_str, bind_vars=bind_vars)))

            unique_edges = set()
            final_results = []
            for item in results:
                edge = item.get('edge')
                if edge:
                    signature = (edge['_from'], edge['_to'], edge['type'])
                    if signature not in unique_edges:
                        unique_edges.add(signature)
                        final_results.append(item)
                else:
                    final_results.append(item)

            return final_results

        except Exception:
            return []

    async def create_or_update_entity_nodes(self, entity: entity_model):
        try:
            normalized_doc_id = self._sanitize(self._normalize_key(entity.m_document_id))
            normalized_cluster_id = self._sanitize(self._normalize_key(entity.m_cluster_id))

            doc_vertex = f"cti_vertices/{normalized_doc_id}"
            cluster_vertex = f"cti_vertices/{normalized_cluster_id}"

            doc_data = entity.model_dump(exclude={"m_cluster_id"})

            normalized_doc_data = {}
            for k, v in doc_data.items():
                if v in (None, "", [], {}):
                    continue
                if isinstance(v, str):
                    normalized_doc_data[k] = self._sanitize(self._normalize_key(v))
                else:
                    normalized_doc_data[k] = v

            if normalized_doc_data:
                await run_in_threadpool(lambda: self.__db.collection("cti_vertices").insert({"_key": normalized_doc_id, "type": "document", **normalized_doc_data}, overwrite=True))

            await run_in_threadpool(lambda: self.__db.collection("cti_vertices").insert({"_key": normalized_cluster_id, "type": "cluster"}, overwrite=True))
            await run_in_threadpool(lambda: self.__db.collection("cti_edges").insert({"_key": f"{normalized_cluster_id}_to_{normalized_doc_id}", "_from": cluster_vertex, "_to": doc_vertex, "type": "cluster_to_doc"}, overwrite=True))

            properties = entity.model_dump(exclude={"m_cluster_id", "m_document_id"})

            for key, value in properties.items():
                if value in (None, "", [], {}):
                    continue

                values = value if isinstance(value, list) else [value]

                for item in values:
                    if item in (None, "", [], {}):
                        continue

                    normalized_item = self._sanitize(self._normalize_key(item))

                    prop_key = f"{key}:{normalized_item}"
                    prop_vertex = f"cti_vertices/{prop_key}"
                    edge_key = f"{normalized_doc_id}_{key}_{normalized_item}"

                    await run_in_threadpool(lambda: self.__db.collection("cti_vertices").insert({"_key": prop_key, "value": normalized_item, "type": key}, overwrite=True))
                    await run_in_threadpool(lambda: self.__db.collection("cti_edges").insert({"_key": edge_key, "_from": doc_vertex, "_to": prop_vertex, "type": f"has_{key}"}, overwrite=True))

            return {"status": "success", "message": f"Entity {normalized_doc_id} processed."}

        except Exception as ex:
            print(ex, flush=True)
            log.g().e(f"ARANGO ENTITY UPSERT ERROR: {ex}")
            return {"status": "error", "message": str(ex)}
