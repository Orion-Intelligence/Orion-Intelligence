from orion.api.server.entity_manager.constants import enums as graph_enums
from orion.constants.constant import allowed_key_titles
from orion.constants.cti_graph_schema import DEFAULT_CLUSTER_IDS, DEFAULT_CLUSTER_KEYS


class EntityRequestGenerator:
    GRAPH_EXTRA_KEY_TITLES = graph_enums.GRAPH_EXTRA_KEY_TITLES
    STRONG_RELATED_PROPERTY_KEYS = {
        "m_alias",
        "m_asns",
        "m_attacker",
        "m_author",
        "m_company_name",
        "m_crypto_address",
        "m_cve",
        "m_cwe",
        "m_domain",
        "m_email",
        "m_enterprise_attack_tactics",
        "m_enterprise_attack_techniques",
        "m_family",
        "m_file_name",
        "m_file_paths",
        "m_hash",
        "m_hashes",
        "m_hashtag",
        "m_imphash",
        "m_ip",
        "m_mac_address",
        "m_md5",
        "m_mention",
        "m_org",
        "m_person",
        "m_phone_number",
        "m_product",
        "m_reporter",
        "m_registry_key_path",
        "m_sha1",
        "m_sha256",
        "m_sha3_384",
        "m_signature",
        "m_social_media_profiles",
        "m_telfhash",
        "m_tlsh",
        "m_uk_nhs",
        "m_username",
        "m_us_driver_license",
        "m_vendor",
        "m_vulnerability",
        "m_xmpp_addresses",
        "m_yara_rule",
    }

    @staticmethod
    def get_cluster_documents_query(normalized_value: str, depth_level: int, document_limit: int):
        if normalized_value == "all":
            queried_id = "all_clusters"
            per_cluster_limit = max(document_limit - 20, 1)
            query_str = f"""
            LET clusters = @cluster_ids

            LET cluster_data = (
              FOR cluster_id IN clusters
                LET docs = (
                  FOR v, e, p IN {depth_level}..{depth_level} ANY cluster_id GRAPH 'cti_graph'
                    OPTIONS {{ bfs: true, uniqueVertices: "global" }}
                    FILTER v.type == 'document'
                    LIMIT {per_cluster_limit}
                    RETURN {{
                      vertex: v,
                      edge: e,
                      path: p
                    }}
                )
                RETURN docs
            )

            LET raw_depth1 = FLATTEN(cluster_data)

            LET document_ids = UNIQUE(
              FOR item IN raw_depth1
                RETURN item.vertex._id
            )

            LET cluster_edges = (
              FOR doc_id IN document_ids
                FOR e IN cti_edges
                  FILTER e._to == doc_id AND e.type == 'cluster_to_doc'
                  FOR cluster IN cti_vertices
                    FILTER cluster._id == e._from AND cluster.type == 'cluster'
                    RETURN {{
                      vertex: cluster,
                      edge: e,
                      path: null
                    }}
            )

            LET depth1 = APPEND(raw_depth1, cluster_edges)
            LET limit_hit_depth1 = false

            RETURN {{
              depth1,
              limit_hit_depth1,
              matched_ids: clusters
            }}
            """
            return queried_id, query_str, {"cluster_ids": list(DEFAULT_CLUSTER_IDS)}
        else:
            queried_id = f"cti_vertices/{normalized_value}"
            query_str = f"""
            LET doc_nodes = (
              FOR v, e, p IN {depth_level}..{depth_level} ANY @cluster_id GRAPH 'cti_graph'
                OPTIONS {{ bfs: true, uniqueVertices: "global" }}
                FILTER v.type == 'document'
                LIMIT {document_limit}
                RETURN {{
                  vertex: v,
                  edge: e,
                  path: p
                }}
            )

            LET document_ids = UNIQUE(
              FOR item IN doc_nodes
                RETURN item.vertex._id
            )

            LET cluster_edges = (
              FOR doc_id IN document_ids
                FOR e IN cti_edges
                  FILTER e._to == doc_id AND e.type == 'cluster_to_doc'
                  FOR cluster IN cti_vertices
                    FILTER cluster._id == e._from AND cluster.type == 'cluster'
                    RETURN {{
                      vertex: cluster,
                      edge: e,
                      path: null
                    }}
            )

            LET depth1 = APPEND(doc_nodes, cluster_edges)
            LET limit_hit_depth1 = LENGTH(doc_nodes) >= {document_limit}

            RETURN {{
              depth1,
              limit_hit_depth1,
              matched_ids: [@cluster_id]
            }}
            """
            bind_vars = {"cluster_id": queried_id}
            return queried_id, query_str, bind_vars

    @staticmethod
    def build_property_search_query(normalized_value: str, depth_level: int, document_limit: int):
        queried_id = "all_properties"
        query_str = f"""
        LET props = (
          FOR property IN cti_vertices
            FILTER property.type NOT IN ['document', 'cluster']
            FILTER CONTAINS(LOWER(TO_STRING(property.label)), @search_value)
              || CONTAINS(LOWER(TO_STRING(property.value)), @search_value)
              || CONTAINS(LOWER(TO_STRING(property.display_value)), @search_value)
              || CONTAINS(LOWER(TO_STRING(property.normalized_value)), @search_value)
              || CONTAINS(LOWER(TO_STRING(property._key)), @search_value)
            RETURN property._id
        )
        LET raw_depth1 = (
          FOR id IN props
            FOR v, e, p IN {depth_level}..{depth_level} ANY id GRAPH 'cti_graph'
              FILTER v.type == 'document'
              LIMIT {document_limit}
              RETURN {{vertex: v, edge: e, path: p}}
        )
        LET document_ids = UNIQUE(
          FOR item IN raw_depth1
            FILTER item.vertex.type == 'document'
            RETURN item.vertex._id
        )

        LET default_clusters = @default_clusters
        LET filtered_cluster_edges = (
          FOR doc_id IN document_ids
            FOR e IN cti_edges
              FILTER e._to == doc_id AND e.type == 'cluster_to_doc'
              LET cluster_key = PARSE_IDENTIFIER(e._from).key
              FILTER cluster_key IN default_clusters
              LET cluster = DOCUMENT(e._from)
              RETURN {{vertex: cluster, edge: e, path: null}}
        )

        LET depth1 = APPEND(raw_depth1, filtered_cluster_edges)
        LET limit_hit_depth1 = false

        RETURN {{
          depth1,
          limit_hit_depth1,
          matched_ids: props
        }}
        """

        bind_vars = {
            "default_clusters": list(DEFAULT_CLUSTER_KEYS),
            "search_value": normalized_value.lower(),
        }

        return queried_id, query_str, bind_vars

    @staticmethod
    def get_document_or_property_query(normalized_value: str,
            normalized_type: str,
            depth_level: int,
            secondary_depth_level: int,
            document_limit: int,
            data_point_type: str):
        start_vertex = (
            f"cti_vertices/{normalized_value}" if data_point_type == "document" else f"cti_vertices/{normalized_type}:{normalized_value}")

        queried_id = start_vertex

        query_str = f"""
        LET depth1_nodes = (
          FOR v, e, p IN {depth_level}..{depth_level} ANY @start_vertex GRAPH 'cti_graph'
            OPTIONS {{ bfs: true, uniqueVertices: "global" }}
            RETURN {{
              vertex: v,
              edge: e,
              path: p
            }}
        )

        LET depth2_nodes = (
          FOR v, e, p IN {secondary_depth_level}..{secondary_depth_level} ANY @start_vertex GRAPH 'cti_graph'
            OPTIONS {{ bfs: true, uniqueVertices: "global" }}
            FILTER v.type == "cluster"
            RETURN {{
              vertex: v,
              edge: e,
              path: p
            }}
        )

        LET raw_depth1 = APPEND(depth1_nodes, depth2_nodes)

        LET property_ids = UNIQUE(
          FOR item IN raw_depth1
            FILTER item.vertex.type NOT IN ['document', 'cluster']
            LET property_key = SPLIT(PARSE_IDENTIFIER(item.vertex._id).key, ":")[0]
            FILTER property_key IN @strong_related_property_types
            RETURN item.vertex._id
        )

        LET doc_counts = (
          FOR pid IN property_ids
            FOR e IN cti_edges
              FILTER e._to == pid AND STARTS_WITH(e.type, "has_")
              FILTER e._from != @start_vertex
              COLLECT doc_id = e._from WITH COUNT INTO score
              SORT score DESC
              LIMIT {document_limit}
              RETURN doc_id
        )

        LET related_docs = (
          FOR doc_id IN doc_counts
            FOR e IN cti_edges
              FILTER e._from == doc_id AND STARTS_WITH(e.type, "has_")
              FILTER e._to IN property_ids
              FOR doc IN cti_vertices
                FILTER doc._id == doc_id AND doc.type == "document"
                RETURN {{
                  vertex: KEEP(doc, "_id", "_key", "_rev", "type", "node_class", "doc_id", "m_document_id", "cluster_id", "module", "label", "display_value", "title", "summary", "published", "source", "source_reliability"),
                  edge: e,
                  path: null
                }}
        )

        LET related_doc_ids = (
          FOR doc_id IN doc_counts
            RETURN doc_id
        )

        LET document_ids = UNION(
          UNIQUE(
            FOR item IN raw_depth1
              FILTER item.vertex.type == 'document'
              RETURN item.vertex._id
          ),
          related_doc_ids
        )

        LET default_clusters = @default_clusters

        LET cluster_edges = (
          FOR doc_id IN document_ids
            FOR e IN cti_edges
              FILTER e._to == doc_id AND e.type == 'cluster_to_doc'
              LET cluster_key = PARSE_IDENTIFIER(e._from).key
              FILTER cluster_key IN default_clusters
              LET cluster = DOCUMENT(e._from)
              RETURN {{
                vertex: cluster,
                edge: e,
                path: null
              }}
        )

        LET start_doc_properties = (
            FOR e IN cti_edges
              FILTER e._from == @start_vertex AND STARTS_WITH(e.type, "has_")
            FOR prop IN cti_vertices
              FILTER prop._id == e._to
              RETURN {{
                vertex: prop,
                edge: e,
                path: null
              }}
        )

        LET depth1 = APPEND(APPEND(APPEND(raw_depth1, cluster_edges), related_docs), start_doc_properties)
        LET limit_hit_depth1 = LENGTH(related_docs) >= {document_limit}

        RETURN {{
          depth1,
          limit_hit_depth1,
          matched_ids: [@start_vertex]
        }}
        """

        bind_vars = {
            "default_clusters": list(DEFAULT_CLUSTER_KEYS),
            "strong_related_property_types": list(EntityRequestGenerator.STRONG_RELATED_PROPERTY_KEYS),
            "start_vertex": start_vertex,
        }
        return queried_id, query_str, bind_vars

    @staticmethod
    def deduplicate_key(key: str) -> str | None:
        dedup_map = {
            'country': 'm_country',
            'countries': 'm_country',
            'location': 'm_location',
            'locations': 'm_location',
            'username': 'm_username',
            'usernames': 'm_username',
            'm_actor_names': 'm_attacker',
            'm_address': 'm_location',
            'm_addresses': 'm_location',
            'm_aliases': 'm_alias',
            'm_archive_url': 'm_url',
            'm_attackers': 'm_attacker',
            'm_authors': 'm_author',
            'm_base_url': 'm_url',
            'm_channel_url': 'm_url',
            'm_clearnet_links': 'm_url',
            'm_companies': 'm_company_name',
            'm_company_names': 'm_company_name',
            'm_countries': 'm_country',
            'm_country_name': 'm_country',
            'm_country_names': 'm_country',
            'm_contact_link': 'm_url',
            'm_crypto_addresses': 'm_crypto_address',
            'm_cves': 'm_cve',
            'm_cwes': 'm_cwe',
            'm_domains': 'm_domain',
            'm_dumplink': 'm_url',
            'm_file_arch': 'm_platform',
            'm_file_format': 'm_file_type',
            'm_file_path': 'm_file_paths',
            'm_file_type_mime': 'm_file_type',
            'm_forwarded_from': 'm_person',
            'm_external_scanners': 'm_url',
            'm_gimphash': 'm_imphash',
            'm_github_link': 'm_url',
            'm_github_links': 'm_url',
            'm_hashtags': 'm_hashtag',
            'm_hashes': 'm_hashes',
            'm_ipv4_addresses': 'm_ip',
            'm_ipv4_cidrs': 'm_ip',
            'm_ipv6_addresses': 'm_ip',
            'm_ipv6_cidrs': 'm_ip',
            'm_ips': 'm_ip',
            'm_mac_addresses': 'm_mac_address',
            'm_media_url': 'm_url',
            'm_message_sharable_link': 'm_url',
            'm_md5_hash': 'm_md5',
            'm_md5_hashes': 'm_md5',
            'm_mirror_links': 'm_url',
            'm_orgs': 'm_org',
            'm_organization': 'm_org',
            'm_organizations': 'm_org',
            'm_os': 'm_platform',
            'm_phone_numbers': 'm_phone_number',
            'm_platforms': 'm_platform',
            'm_reference': 'm_url',
            'm_references': 'm_url',
            'm_registry_key_paths': 'm_registry_key_path',
            'm_reporters': 'm_reporter',
            'm_refs': 'm_url',
            'm_sender_name': 'm_person',
            'm_sender_username': 'm_username',
            'm_sha1_hash': 'm_sha1',
            'm_sha1_hashes': 'm_sha1',
            'm_sha3_384_hash': 'm_sha3_384',
            'm_sha3_384_hashes': 'm_sha3_384',
            'm_sha256_hash': 'm_sha256',
            'm_sha256_hashes': 'm_sha256',
            'm_source_channel_url': 'm_url',
            'm_source_url': 'm_url',
            'm_state': 'm_location',
            'm_states': 'm_location',
            'm_sub_url': 'm_url',
            'm_telephone_nums': 'm_phone_number',
            'm_uk_nhs_numbers': 'm_uk_nhs',
            'm_unencoded_urls': 'm_url',
            'm_us_driver_licenses': 'm_us_driver_license',
            'm_urls': 'm_url',
            'm_usernames': 'm_username',
            'm_users': 'm_person',
            'm_web_url': 'm_url',
            'm_websites': 'm_url',
            'm_weblink': 'm_url',
            'm_yara_rules': 'm_yara_rule',
        }

        canonical = dedup_map.get(key, key)
        return canonical if canonical in allowed_key_titles or canonical in EntityRequestGenerator.GRAPH_EXTRA_KEY_TITLES else None
