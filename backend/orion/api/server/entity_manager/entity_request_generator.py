class EntityRequestGenerator:
    @staticmethod
    def get_cluster_documents_query(normalized_value: str, depth_level: int, document_limit: int):
        if normalized_value == "all":
            queried_id = "all_clusters"
            query_str = f"""
            LET clusters = ["cti_vertices/general", "cti_vertices/leak", "cti_vertices/defacement", "cti_vertices/chat", "cti_vertices/exploit"]

            LET cluster_data = (
              FOR cluster_id IN clusters
                LET docs = (
                  FOR v, e, p IN {depth_level}..{depth_level} ANY cluster_id GRAPH 'cti_graph'
                    OPTIONS {{ bfs: true, uniqueVertices: "global" }}
                    FILTER v.type == 'document'
                    LIMIT {document_limit - 20}
                    RETURN {{
                      vertex: {{
                        _id: v._id,
                        _key: v._key,
                        type: v.type
                      }},
                      edge: {{
                        _id: e._id,
                        _from: e._from,
                        _to: e._to,
                        type: e.type
                      }},
                      path: {{
                        vertices: (
                          FOR vert IN p.vertices
                            RETURN {{
                              _id: vert._id,
                              _key: vert._key,
                              type: vert.type
                            }}
                        ),
                        edges: (
                          FOR ed IN p.edges
                            RETURN {{
                              _id: ed._id,
                              _from: ed._from,
                              _to: ed._to,
                              type: ed.type
                            }}
                        )
                      }}
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
                      vertex: {{
                        _id: cluster._id,
                        _key: cluster._key,
                        type: cluster.type
                      }},
                      edge: {{
                        _id: e._id,
                        _from: e._from,
                        _to: e._to,
                        type: e.type
                      }},
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
            return queried_id, query_str, {}
        else:
            queried_id = f"cti_vertices/{normalized_value}"
            query_str = f"""
            LET doc_nodes = (
              FOR v, e, p IN {depth_level}..{depth_level} ANY @cluster_id GRAPH 'cti_graph'
                OPTIONS {{ bfs: true, uniqueVertices: "global" }}
                FILTER v.type == 'document'
                LIMIT {document_limit}
                RETURN {{
                  vertex: {{
                    _id: v._id,
                    _key: v._key,
                    type: v.type
                  }},
                  edge: {{
                    _id: e._id,
                    _from: e._from,
                    _to: e._to,
                    type: e.type
                  }},
                  path: {{
                    vertices: (
                      FOR vert IN p.vertices
                        RETURN {{
                          _id: vert._id,
                          _key: vert._key,
                          type: vert.type
                        }}
                    ),
                    edges: (
                      FOR ed IN p.edges
                        RETURN {{
                          _id: ed._id,
                          _from: ed._from,
                          _to: ed._to,
                          type: ed.type
                        }}
                    )
                  }}
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
                      vertex: {{
                        _id: cluster._id,
                        _key: cluster._key,
                        type: cluster.type
                      }},
                      edge: {{
                        _id: e._id,
                        _from: e._from,
                        _to: e._to,
                        type: e.type
                      }},
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
        if normalized_value!="all":
            normalized_value = EntityRequestGenerator.deduplicate_key(normalized_value)

        bind_vars = {}
        if normalized_value == "all":
            queried_id = "all_properties"
            query_str = f"""
            LET props = (
              FOR property IN cti_vertices
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

            LET default_clusters = ["general", "defacement", "leak", "chat", "exploit"]
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
        else:
            queried_id = normalized_value
            query_str = f"""
            LET props = (
              FOR property IN cti_vertices
                FILTER CONTAINS(LOWER(property.value), @search_value)
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

            LET default_clusters = ["general", "defacement", "leak", "chat", "exploit"]
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
            bind_vars = {"search_value": normalized_value}

        return queried_id, query_str, bind_vars

    @staticmethod
    def get_document_or_property_query(normalized_value: str, normalized_type: str, depth_level: int, secondary_depth_level: int, document_limit: int, data_point_type: str):
        start_vertex = (
            f"cti_vertices/{normalized_value}"
            if data_point_type == "document"
            else f"cti_vertices/{normalized_type}:{normalized_value}"
        )

        queried_id = start_vertex

        query_str = f"""
        LET depth1_nodes = (
          FOR v, e, p IN {depth_level}..{depth_level} ANY @start_vertex GRAPH 'cti_graph'
            OPTIONS {{ bfs: true, uniqueVertices: "global" }}
            RETURN {{
              vertex: KEEP(v, "_id", "_key", "_rev", "type", "doc_id"),
              edge: e,
              path: p
            }}
        )

        LET depth2_nodes = (
          FOR v, e, p IN {secondary_depth_level}..{secondary_depth_level} ANY @start_vertex GRAPH 'cti_graph'
            OPTIONS {{ bfs: true, uniqueVertices: "global" }}
            FILTER v.type == "cluster"
            RETURN {{
              vertex: KEEP(v, "_id", "_key", "_rev", "type", "doc_id"),
              edge: e,
              path: p
            }}
        )

        LET raw_depth1 = APPEND(depth1_nodes, depth2_nodes)

        LET property_ids = UNIQUE(
          FOR item IN raw_depth1
            FILTER item.vertex.type NOT IN ['document', 'cluster']
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
              FOR doc IN cti_vertices
                FILTER doc._id == doc_id AND doc.type == "document"
                RETURN {{
                  vertex: KEEP(doc, "_id", "_key", "_rev", "type", "doc_id"),
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

        LET default_clusters = ["general", "defacement", "leak", "chat", "exploit"]

        LET cluster_edges = (
          FOR doc_id IN document_ids
            FOR e IN cti_edges
              FILTER e._to == doc_id AND e.type == 'cluster_to_doc'
              LET cluster_key = PARSE_IDENTIFIER(e._from).key
              FILTER cluster_key IN default_clusters
              LET cluster = DOCUMENT(e._from)
              RETURN {{
                vertex: KEEP(cluster, "_id", "_key", "_rev", "type", "doc_id"),
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
                vertex: KEEP(prop, "_id", "_key", "_rev", "type", "doc_id"),
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

        bind_vars = {"start_vertex": start_vertex}
        return queried_id, query_str, bind_vars

    @staticmethod
    def deduplicate_key(key: str) -> str | None:
        dedup_map = {
            'm_ips': 'm_ip',
            'm_ipv4s': 'm_ip',
            'm_ipv6s': 'm_ip',
            'm_ipv4_cidrs': 'm_ip',
            'm_cves': 'm_cve',
            'm_phone_numbers': 'm_phone_number',
            'm_telephone_nums': 'm_phone_number',
            'm_domains': 'm_domain',
            'm_weblink': 'm_url',
            'm_websites': 'm_url',
            'm_crypto': 'm_bitcoin_addresses',
            'm_xmr_wallet': 'm_monero_addresses',
        }

        allowed_keys = {
            'm_asns', 'm_attacker', 'm_au_abn', 'm_au_acn', 'm_au_medicare', 'm_au_tfn', 'm_aws_secret',
            'm_bitcoin_addresses', 'm_code_snippet', 'm_company_name', 'm_country', 'm_country_name',
            'm_credit_card', 'm_cve', 'm_cwe', 'm_document_id', 'm_dumplink', 'm_email', 'm_employee_count',
            'm_encoded_urls', 'm_event', 'm_fac', 'm_file_path', 'm_file_paths', 'm_gpe', 'm_hashtag',
            'm_in_aadhaar', 'm_in_pan', 'm_in_passport', 'm_in_vehicle_registration', 'm_in_voter',
            'm_industry', 'm_ip', 'm_language', 'm_law', 'm_location', 'm_medical_license', 'm_mention',
            'm_mitre_ttp_name', 'm_mitre_ttp_type', 'm_monero_addresses', 'm_name', 'm_norp', 'm_org',
            'm_password', 'm_person', 'm_phone_number', 'm_product', 'm_social_media_profiles', 'm_states',
            'm_team', 'm_title', 'm_uk_nhs', 'm_uk_nino', 'm_url', 'm_us_bank_number', 'm_us_driver_license',
            'm_us_itin', 'm_us_passport', 'm_us_ssn', 'm_user_agents', 'm_username', 'm_xmpp_addresses',
            'm_yara_rule', 'm_domain'
        }

        canonical = dedup_map.get(key, key)
        return canonical if canonical in allowed_keys else None
