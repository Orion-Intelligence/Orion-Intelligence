(backend-api-reference)=

# Backend API Reference

This reference is generated from FastAPI route decorators in `backend/routes`. It lists each discovered endpoint, handler, request model hints, dependencies, roles, licenses, system settings, and return targets visible from static analysis.

Generated endpoint count: **198**.

## Endpoint Summary

| Method | Path | Handler | Source | Roles | Licenses | Settings |
| --- | --- | --- | --- | --- | --- | --- |
| `GET` | `/admin/api/db_system_model/row-action` | `block_row_action` | `backend/routes/admin_routes.py:16` | - | - | - |
| `POST` | `/admin/api/db_user_account/edit/{id}` | `custom_edit_api` | `backend/routes/admin_routes.py:23` | - | - | - |
| `POST` | `/admin/api/db_user_account/edit/{id}/` | `custom_edit_api_trailing` | `backend/routes/admin_routes.py:29` | - | - | - |
| `POST` | `/api/public/update` | `update_public_config` | `backend/routes/admin_routes.py:38` | - | - | - |
| `DELETE` | `/api/system/image` | `update_user` | `backend/routes/admin_routes.py:46` | - | - | - |
| `PUT` | `/api/system/image` | `upload_system_image` | `backend/routes/admin_routes.py:54` | - | - | - |
| `POST` | `/api/cti/fetch` | `fetch_cti_label` | `backend/routes/api_micros.py:23` | - | - | - |
| `POST` | `/api/nlp/parse/ai` | `parse_ai` | `backend/routes/api_micros.py:30` | - | - | ai_endpoint_enabled |
| `POST` | `/api/nlp/summarize/ai` | `summarize_ai` | `backend/routes/api_micros.py:37` | - | module:ai | ai_endpoint_enabled |
| `POST` | `/api/nlp/chat/report` | `chat_report` | `backend/routes/api_micros.py:51` | - | - | ai_endpoint_enabled |
| `POST` | `/api/nexus/chat` | `nexus_chat` | `backend/routes/api_micros.py:66` | - | scanning | ai_endpoint_enabled |
| `POST` | `/api/nexus/analyze-text` | `nexus_analyze_text` | `backend/routes/api_micros.py:81` | - | module:ai | ai_endpoint_enabled |
| `POST` | `/api/search/breach` | `search_leak` | `backend/routes/api_routes.py:118` | - | module:breach | - |
| `POST` | `/api/search/social` | `search_social` | `backend/routes/api_routes.py:140` | - | - | - |
| `POST` | `/api/search/exploit` | `search_exploit` | `backend/routes/api_routes.py:168` | - | - | - |
| `POST` | `/api/search/defacement` | `search_defacement` | `backend/routes/api_routes.py:184` | - | - | - |
| `POST` | `/api/feedback/comment/{doc_id}` | `add_feedback_comment` | `backend/routes/api_routes.py:198` | - | - | - |
| `GET` | `/api/feedback/{doc_id}` | `get_feedback` | `backend/routes/api_routes.py:208` | - | - | - |
| `POST` | `/api/feedback/recommended/{doc_id}` | `increment_recommended_feedback` | `backend/routes/api_routes.py:218` | - | - | - |
| `POST` | `/api/feedback/trust/{doc_id}` | `increment_trust_feedback` | `backend/routes/api_routes.py:228` | - | - | - |
| `POST` | `/api/feedback/untrust/{doc_id}` | `increment_untrust_feedback` | `backend/routes/api_routes.py:238` | - | - | - |
| `GET` | `/api/user/{user_id}/get` | `get_public_user` | `backend/routes/api_routes.py:248` | - | - | - |
| `GET` | `/api/user/{user_id}/activity` | `get_public_user_activity` | `backend/routes/api_routes.py:258` | - | - | - |
| `GET` | `/api/directory` | `get_directory` | `backend/routes/api_routes.py:271` | - | - | - |
| `GET` | `/api/dumps` | `get_dumps` | `backend/routes/api_routes.py:284` | - | module:dumps | - |
| `GET` | `/api/insight` | `get_insight` | `backend/routes/api_routes.py:297` | - | - | - |
| `GET` | `/api/insight/country` | `get_country_insight` | `backend/routes/api_routes.py:313` | - | - | - |
| `POST` | `/api/search/stealerlogs` | `search_stealerlog` | `backend/routes/api_routes.py:336` | - | - | - |
| `POST` | `/api/search/stealer/ioc` | `search_stealer_iocs` | `backend/routes/api_routes.py:351` | - | - | - |
| `POST` | `/api/search/consolidated` | `search_consolidated` | `backend/routes/api_routes.py:367` | - | - | - |
| `POST` | `/api/search/consolidated/ioc` | `search_consolidated_iocs` | `backend/routes/api_routes.py:386` | - | - | - |
| `GET` | `/api/search/defacement/{doc_id}` | `get_defacement_document` | `backend/routes/api_routes.py:407` | - | module:defacement | - |
| `GET` | `/api/search/breach/{doc_id}` | `get_leak_document` | `backend/routes/api_routes.py:421` | - | module:breach | - |
| `GET` | `/api/search/news/{doc_id}` | `get_news_document` | `backend/routes/api_routes.py:435` | - | module:news | - |
| `GET` | `/api/search/exploit/{doc_id}` | `get_exploit_document` | `backend/routes/api_routes.py:449` | - | module:exploit | - |
| `GET` | `/api/search/strategic/{doc_id}` | `get_general_document` | `backend/routes/api_routes.py:463` | - | module:general | - |
| `GET` | `/api/search/chat/{doc_id}` | `get_chat_document` | `backend/routes/api_routes.py:477` | - | module:chat | - |
| `GET` | `/api/search/social/{doc_id}` | `get_social_document` | `backend/routes/api_routes.py:491` | - | module:social | - |
| `GET` | `/api/search/breach/screenshot/{filename}` | `get_screenshot` | `backend/routes/api_routes.py:505` | - | module:breach | - |
| `POST` | `/api/dynamic/user` | `search_dynamic_email` | `backend/routes/api_routes.py:518` | - | - | - |
| `POST` | `/api/dynamic/cracked` | `search_dynamic_cracked` | `backend/routes/api_routes.py:532` | - | - | - |
| `POST` | `/api/dynamic/software` | `search_dynamic_software` | `backend/routes/api_routes.py:546` | - | - | - |
| `POST` | `/api/urlscan/domain` | `parse_domain_scan` | `backend/routes/api_routes.py:560` | - | - | - |
| `POST` | `/api/urlscan/subdomains` | `parse_subdomain_scan` | `backend/routes/api_routes.py:574` | - | - | - |
| `POST` | `/api/urlscan/dns` | `parse_dns_scan` | `backend/routes/api_routes.py:588` | - | - | - |
| `POST` | `/api/urlscan/wayback` | `parse_wayback_scan` | `backend/routes/api_routes.py:602` | - | - | - |
| `POST` | `/api/urlscan/ip` | `parse_ip` | `backend/routes/api_routes.py:612` | - | - | - |
| `POST` | `/api/social/scrape` | `scrape_social` | `backend/routes/api_routes.py:621` | - | - | - |
| `POST` | `/api/dynamic/social` | `search_dynamic_social` | `backend/routes/api_routes.py:635` | - | - | - |
| `POST` | `/api/index/injection` | `index_injection` | `backend/routes/api_routes.py:64` | - | - | - |
| `POST` | `/api/dynamic/wanted` | `search_dynamic_wanted` | `backend/routes/api_routes.py:648` | - | - | - |
| `POST` | `/api/dynamic/national-identity` | `search_dynamic_national_identity` | `backend/routes/api_routes.py:661` | - | - | - |
| `GET` | `/api/search/breach/stix/{doc_id}` | `get_breach_stix_document` | `backend/routes/api_routes.py:676` | - | - | - |
| `GET` | `/api/search/strategic/stix/{doc_id}` | `get_strategic_stix_document` | `backend/routes/api_routes.py:692` | - | - | - |
| `GET` | `/api/search/defacement/stix/{doc_id}` | `get_defacement_stix_document` | `backend/routes/api_routes.py:708` | - | - | - |
| `GET` | `/api/search/exploit/stix/{doc_id}` | `get_exploit_stix_document` | `backend/routes/api_routes.py:723` | - | - | - |
| `GET` | `/api/search/social/stix/{doc_id}` | `get_social_stix_document` | `backend/routes/api_routes.py:737` | - | - | - |
| `GET` | `/api/search/chat/stix/{doc_id}` | `get_chat_stix_document` | `backend/routes/api_routes.py:751` | - | - | - |
| `GET` | `/api/graph` | `get_entity_relations` | `backend/routes/api_routes.py:766` | - | cti_graph | - |
| `POST` | `/api/profile/event-management/siem/search` | `search_siem_logs` | `backend/routes/api_routes.py:78` | - | maintainer | - |
| `GET` | `/api/search/news/stix/{doc_id}` | `get_news_stix_document` | `backend/routes/api_routes.py:782` | - | - | - |
| `POST` | `/api/ioc/extract` | `extract_ioc` | `backend/routes/api_routes.py:799` | - | scanning | - |
| `POST` | `/api/apk/scan` | `scan_apk` | `backend/routes/api_routes.py:816` | - | scanning | - |
| `POST` | `/api/crypto/scan` | `crypto_scan` | `backend/routes/api_routes.py:836` | - | scanning | - |
| `POST` | `/api/cross/search` | `cross_search` | `backend/routes/api_routes.py:853` | - | scanning | - |
| `POST` | `/api/netintel/resolve_ip` | `resolve_ip` | `backend/routes/api_routes.py:867` | - | - | - |
| `POST` | `/api/netintel/ipscanner` | `ipscanner` | `backend/routes/api_routes.py:881` | - | - | - |
| `POST` | `/api/netintel/url_vulnerability_scan` | `url_vulnerability_scan` | `backend/routes/api_routes.py:895` | - | - | - |
| `POST` | `/api/netintel/iot_detect` | `geo_camera_detect` | `backend/routes/api_routes.py:909` | - | - | - |
| `POST` | `/api/search/strategic` | `search_general` | `backend/routes/api_routes.py:91` | - | - | - |
| `POST` | `/api/netintel/camera_detect_ranges` | `geo_camera_detect_ranges` | `backend/routes/api_routes.py:924` | - | - | - |
| `POST` | `/api/stix/convert/{kind}` | `convert_stix_single` | `backend/routes/api_routes.py:938` | - | - | - |
| `POST` | `/api/stix/convert/{kind}/batch` | `convert_stix_batch` | `backend/routes/api_routes.py:954` | - | - | - |
| `POST` | `/api/verify/{token}` | `verifyUser` | `backend/routes/auth_routes.py:103` | - | - | - |
| `POST` | `/api/forgot` | `forgotPassword` | `backend/routes/auth_routes.py:108` | - | - | - |
| `POST` | `/api/subscription/request` | `subscriptionRequest` | `backend/routes/auth_routes.py:113` | - | - | - |
| `POST` | `/api/updatePassword` | `updatePassword` | `backend/routes/auth_routes.py:118` | - | - | - |
| `POST` | `/api/support` | `support` | `backend/routes/auth_routes.py:122` | - | - | - |
| `POST` | `/api/token` | `token` | `backend/routes/auth_routes.py:34` | - | - | - |
| `POST` | `/api/token/demo` | `token_demo` | `backend/routes/auth_routes.py:46` | - | - | - |
| `POST` | `/api/token/2fa/verify` | `verify_2fa` | `backend/routes/auth_routes.py:61` | - | - | - |
| `POST` | `/api/token/refresh` | `refresh_token` | `backend/routes/auth_routes.py:72` | - | - | - |
| `POST` | `/api/logout` | `logout` | `backend/routes/auth_routes.py:84` | - | - | - |
| `POST` | `/api/signup` | `signup` | `backend/routes/auth_routes.py:93` | - | - | - |
| `POST` | `/api/signup/verificaion` | `signup` | `backend/routes/auth_routes.py:98` | - | - | - |
| `POST` | `/api/profile/feeder/scripts/{script_id}/delete-value` | `delete_feeder_value` | `backend/routes/crawl_routes.py:100` | - | module:feeder | - |
| `POST` | `/api/profile/feeder/scripts/{script_id}/toggle` | `toggle_feeder_script` | `backend/routes/crawl_routes.py:108` | - | module:feeder | - |
| `POST` | `/api/profile/feeder/scripts/{script_id}/owner` | `transfer_feeder_script_owner` | `backend/routes/crawl_routes.py:116` | - | module:feeder | - |
| `POST` | `/api/profile/feeder/upload` | `upload_feeder_script` | `backend/routes/crawl_routes.py:124` | - | module:feeder | - |
| `POST` | `/api/feeder/status` | `update_feeder_script_status` | `backend/routes/crawl_routes.py:136` | - | - | - |
| `POST` | `/api/index/leak` | `index_leak_data` | `backend/routes/crawl_routes.py:146` | - | - | - |
| `POST` | `/api/index/news` | `index_news_data` | `backend/routes/crawl_routes.py:152` | - | - | - |
| `POST` | `/api/index/tracking` | `index_tracking_data` | `backend/routes/crawl_routes.py:158` | - | - | - |
| `POST` | `/api/index/exploit` | `index_exploit_data` | `backend/routes/crawl_routes.py:164` | - | - | - |
| `POST` | `/api/index/defacement` | `index_defacement_data` | `backend/routes/crawl_routes.py:171` | - | - | - |
| `POST` | `/api/screenshot` | `screenshot` | `backend/routes/crawl_routes.py:179` | - | - | - |
| `POST` | `/api/index/generic` | `index_generic` | `backend/routes/crawl_routes.py:186` | - | - | - |
| `POST` | `/api/nlp/parse` | `parse_text` | `backend/routes/crawl_routes.py:194` | - | - | - |
| `POST` | `/api/index/chat` | `index_chat_data` | `backend/routes/crawl_routes.py:201` | - | - | - |
| `POST` | `/api/index/social` | `index_social_data` | `backend/routes/crawl_routes.py:207` | - | - | - |
| `POST` | `/api/index/swarm` | `index_swarm_data` | `backend/routes/crawl_routes.py:213` | - | - | - |
| `POST` | `/api/index/sanctions` | `index_sanctions_data` | `backend/routes/crawl_routes.py:218` | - | - | - |
| `POST` | `/api/index/entity` | `index_entities` | `backend/routes/crawl_routes.py:249` | - | - | - |
| `GET` | `/api/feeder/{index_type}` | `feeder` | `backend/routes/crawl_routes.py:25` | - | - | - |
| `POST` | `/api/index/dump` | `index_dump` | `backend/routes/crawl_routes.py:258` | - | - | - |
| `POST` | `/api/index/stealerlog` | `index_stealerlog` | `backend/routes/crawl_routes.py:264` | - | - | - |
| `GET` | `/api/parser` | `parser` | `backend/routes/crawl_routes.py:31` | - | - | - |
| `GET` | `/api/profile/feeder/catalog` | `get_feeder_catalog` | `backend/routes/crawl_routes.py:39` | - | module:feeder | - |
| `GET` | `/api/profile/feeder/scripts` | `get_feeder_scripts` | `backend/routes/crawl_routes.py:47` | - | module:feeder | - |
| `GET` | `/api/profile/feeder/users` | `get_feeder_owner_users` | `backend/routes/crawl_routes.py:60` | - | module:feeder | - |
| `POST` | `/api/profile/feeder/scripts/clear-all` | `clear_feeder_scripts` | `backend/routes/crawl_routes.py:68` | - | module:feeder | - |
| `POST` | `/api/profile/feeder/scripts/enable-all` | `enable_feeder_scripts` | `backend/routes/crawl_routes.py:76` | - | module:feeder | - |
| `POST` | `/api/profile/feeder/scripts/disable-all` | `disable_feeder_scripts` | `backend/routes/crawl_routes.py:84` | - | module:feeder | - |
| `POST` | `/api/profile/feeder/scripts/{script_id}/delete` | `delete_feeder_script` | `backend/routes/crawl_routes.py:92` | - | module:feeder | - |
| `GET` | `/api/public` | `get_public_config` | `backend/routes/public_api_routes.py:24` | - | - | - |
| `GET` | `/api/s/static/tenant/{id}` | `get_tenant_resource` | `backend/routes/public_api_routes.py:29` | - | - | - |
| `GET` | `/api/s/static/user/{id}` | `get_user_resource` | `backend/routes/public_api_routes.py:34` | - | - | - |
| `GET` | `/api/s/static/favicon` | `get_system_resource` | `backend/routes/public_api_routes.py:39` | - | - | - |
| `GET` | `/api/s/static/system/{id}` | `get_system_resource` | `backend/routes/public_api_routes.py:43` | - | - | - |
| `GET` | `/robots.txt` | `robots_txt` | `backend/routes/public_api_routes.py:47` | - | - | - |
| `GET` | `/api/search/stealerlogs` | `search_stealerlog` | `backend/routes/public_api_routes.py:55` | - | - | - |
| `POST` | `/api/social/followers` | `search_dynamic_followers` | `backend/routes/social_routes.py:104` | - | scanning | - |
| `POST` | `/api/social/following` | `search_dynamic_following` | `backend/routes/social_routes.py:117` | - | scanning | - |
| `POST` | `/api/social/posts` | `search_dynamic_posts` | `backend/routes/social_routes.py:130` | - | scanning | - |
| `POST` | `/api/social/entity` | `search_dynamic_entity` | `backend/routes/social_routes.py:138` | - | scanning | - |
| `POST` | `/api/social/metadata` | `search_social_metadata` | `backend/routes/social_routes.py:151` | - | scanning | - |
| `POST` | `/api/social/session/upsert` | `upsert_social_session` | `backend/routes/social_routes.py:159` | - | scanning | - |
| `GET` | `/api/social/session/tabs` | `get_social_tabs` | `backend/routes/social_routes.py:168` | - | scanning | - |
| `POST` | `/api/social/session/tab/add` | `add_social_tab` | `backend/routes/social_routes.py:176` | - | scanning | - |
| `POST` | `/api/social/recon` | `search_dynamic_email` | `backend/routes/social_routes.py:31` | - | scanning | - |
| `POST` | `/api/social/phone/recon` | `search_dynamic_phone_recon` | `backend/routes/social_routes.py:39` | - | scanning | - |
| `POST` | `/api/social/profile` | `search_dynamic_profile` | `backend/routes/social_routes.py:52` | - | scanning | - |
| `POST` | `/api/social/online/images` | `search_dynamic_online_images` | `backend/routes/social_routes.py:65` | - | scanning | - |
| `POST` | `/api/social/recon/image` | `search_dynamic_image` | `backend/routes/social_routes.py:82` | - | scanning | - |
| `POST` | `/api/get/current/user/chat-history` | `get_current_user_chat_history` | `backend/routes/tenant_routes.py:103` | - | - | - |
| `POST` | `/api/update/current/user/chat-history` | `update_current_user_chat_history` | `backend/routes/tenant_routes.py:111` | - | - | - |
| `DELETE` | `/api/tenant/image` | `update_user` | `backend/routes/tenant_routes.py:120` | - | - | - |
| `PUT` | `/api/tenant/image` | `upload_profile_image` | `backend/routes/tenant_routes.py:128` | - | - | - |
| `PUT` | `/api/system/image` | `upload_profile_image` | `backend/routes/tenant_routes.py:135` | - | - | - |
| `DELETE` | `/api/user/image` | `update_user` | `backend/routes/tenant_routes.py:144` | - | - | - |
| `PUT` | `/api/user/image` | `upload_profile_image` | `backend/routes/tenant_routes.py:152` | - | - | - |
| `POST` | `/api/delete/user` | `delete_user` | `backend/routes/tenant_routes.py:160` | - | - | - |
| `POST` | `/api/tenant/create/user` | `create_tenant_user` | `backend/routes/tenant_routes.py:175` | - | maintainer | - |
| `POST` | `/api/audit/logs` | `get_audit_logs` | `backend/routes/tenant_routes.py:190` | - | maintainer | - |
| `DELETE` | `/api/audit/{log_id}/delete` | `delete_audit_log` | `backend/routes/tenant_routes.py:202` | - | - | - |
| `GET` | `/api/get/tenant/alert/summary` | `get_node` | `backend/routes/tenant_routes.py:211` | - | - | - |
| `POST` | `/api/get/tenant/node` | `get_node` | `backend/routes/tenant_routes.py:219` | - | - | - |
| `POST` | `/api/alert/add` | `add_custom_alert` | `backend/routes/tenant_routes.py:233` | - | - | - |
| `POST` | `/api/alert/seen` | `set_alerts_seen` | `backend/routes/tenant_routes.py:247` | - | - | - |
| `POST` | `/api/alert/delete` | `delete_alert` | `backend/routes/tenant_routes.py:261` | - | - | - |
| `POST` | `/api/alert/update` | `update_alert` | `backend/routes/tenant_routes.py:276` | - | - | - |
| `GET` | `/api/profile/alerts` | `get_user_alerts` | `backend/routes/tenant_routes.py:290` | - | - | - |
| `POST` | `/api/profile/alert/scan` | `run_user_ioc_alerts` | `backend/routes/tenant_routes.py:318` | - | maintainer | - |
| `POST` | `/api/profile/alert/scan/cancel` | `cancel_user_ioc_alerts` | `backend/routes/tenant_routes.py:340` | - | maintainer | - |
| `POST` | `/api/profile/alerts/delete/all` | `delete_all_alerts` | `backend/routes/tenant_routes.py:349` | - | maintainer | - |
| `POST` | `/api/profile/alerts/delete/{_type}` | `delete_typed_alerts` | `backend/routes/tenant_routes.py:357` | - | maintainer | - |
| `POST` | `/api/get/tenant` | `get_tenant` | `backend/routes/tenant_routes.py:36` | - | - | - |
| `POST` | `/api/profile/alert/scan/status` | `get_alert_scan_status` | `backend/routes/tenant_routes.py:371` | - | - | - |
| `POST` | `/api/update/tenants` | `update_tenant` | `backend/routes/tenant_routes.py:51` | - | maintainer | - |
| `POST` | `/api/users` | `get_tenant_users` | `backend/routes/tenant_routes.py:65` | - | - | - |
| `POST` | `/api/tenants/get` | `get_all_tenants` | `backend/routes/tenant_routes.py:79` | - | - | - |
| `POST` | `/api/update/user` | `update_user` | `backend/routes/tenant_routes.py:87` | - | - | - |
| `POST` | `/api/update/current/user` | `update_user` | `backend/routes/tenant_routes.py:95` | - | - | - |
| `POST` | `/api/dynamic/user` | `test_search_dynamic_email` | `backend/routes/test_routes.py:105` | - | scanning | - |
| `POST` | `/api/dynamic/cracked` | `test_search_dynamic_cracked` | `backend/routes/test_routes.py:117` | - | scanning | - |
| `POST` | `/api/forgot` | `forgotPassword` | `backend/routes/test_routes.py:125` | - | - | - |
| `POST` | `/api/dynamic/software` | `test_search_dynamic_software` | `backend/routes/test_routes.py:134` | - | scanning | - |
| `POST` | `/api/urlscan/dns` | `test_search_dynamic_ip_scan` | `backend/routes/test_routes.py:147` | - | scanning | - |
| `POST` | `/api/urlscan/ip` | `test_search_dynamic_ip_scan` | `backend/routes/test_routes.py:147` | - | scanning | - |
| `POST` | `/api/dynamic/social` | `test_search_dynamic_social` | `backend/routes/test_routes.py:155` | - | scanning | - |
| `POST` | `/api/dynamic/wanted` | `test_search_dynamic_wanted` | `backend/routes/test_routes.py:167` | - | scanning | - |
| `POST` | `/api/dynamic/national-identity` | `test_search_dynamic_national_identity` | `backend/routes/test_routes.py:176` | - | scanning | - |
| `POST` | `/api/urlscan/domain` | `test_parse_domain` | `backend/routes/test_routes.py:185` | - | scanning | - |
| `POST` | `/api/urlscan/subdomains` | `test_parse_subdomains` | `backend/routes/test_routes.py:194` | - | scanning | - |
| `POST` | `/api/urlscan/wayback` | `test_parse_wayback` | `backend/routes/test_routes.py:203` | - | scanning | - |
| `POST` | `/api/ioc/extract` | `extract_ioc` | `backend/routes/test_routes.py:212` | - | - | - |
| `POST` | `/file/scan/{user_id}` | `file_scan` | `backend/routes/test_routes.py:219` | - | - | - |
| `POST` | `/api/apk/scan` | `extract_ioc` | `backend/routes/test_routes.py:229` | - | - | - |
| `POST` | `/api/crypto/scan` | `extract_crypto` | `backend/routes/test_routes.py:242` | - | - | - |
| `POST` | `/api/nexus/analyze-text` | `test_nexus_analyze_text` | `backend/routes/test_routes.py:256` | - | - | - |
| `POST` | `/api/cross/search` | `test_cross_search` | `backend/routes/test_routes.py:268` | - | scanning | - |
| `POST` | `/api/netintel/resolve_ip` | `test_netintel_resolve_ip` | `backend/routes/test_routes.py:279` | - | - | - |
| `POST` | `/api/netintel/ipscanner` | `test_netintel_ipscanner` | `backend/routes/test_routes.py:293` | - | - | - |
| `POST` | `/api/netintel/url_vulnerability_scan` | `test_netintel_url_vulnerability_scan` | `backend/routes/test_routes.py:307` | - | - | - |
| `POST` | `/api/netintel/iot_detect` | `test_netintel_camera_detect` | `backend/routes/test_routes.py:318` | - | - | - |
| `POST` | `/api/netintel/camera_detect_ranges` | `test_netintel_camera_detect_ranges` | `backend/routes/test_routes.py:332` | - | - | - |
| `POST` | `/api/social/recon` | `test_social_recon` | `backend/routes/test_routes.py:344` | - | scanning | - |
| `POST` | `/api/social/recon/image` | `test_social_recon_image` | `backend/routes/test_routes.py:353` | - | scanning | - |
| `POST` | `/api/social/profile` | `test_social_profile` | `backend/routes/test_routes.py:362` | - | scanning | - |
| `POST` | `/api/social/online/images` | `test_social_online_images` | `backend/routes/test_routes.py:371` | - | scanning | - |
| `POST` | `/api/social/posts` | `test_social_posts` | `backend/routes/test_routes.py:380` | - | scanning | - |
| `POST` | `/api/social/followers` | `test_social_followers` | `backend/routes/test_routes.py:389` | - | scanning | - |
| `POST` | `/api/social/following` | `test_social_following` | `backend/routes/test_routes.py:398` | - | scanning | - |
| `POST` | `/api/social/entity` | `test_social_entity` | `backend/routes/test_routes.py:407` | - | scanning | - |
| `POST` | `/api/social/session/upsert` | `test_social_session_upsert` | `backend/routes/test_routes.py:416` | - | scanning | - |
| `GET` | `/api/social/session/tabs` | `test_social_session_tabs` | `backend/routes/test_routes.py:425` | - | scanning | - |
| `POST` | `/api/social/session/tab/add` | `test_social_session_tab_add` | `backend/routes/test_routes.py:436` | - | scanning | - |
| `POST` | `/api/get/tenant/node` | `test_get_tenant_node` | `backend/routes/test_routes.py:90` | - | - | - |

## Endpoint Details

### `backend/routes/admin_routes.py`

#### `GET /admin/api/db_system_model/row-action`

- **Handler:** `async block_row_action(name: str = Query(...))`
- **Source:** `backend/routes/admin_routes.py:16`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** -
- **Return expressions:** `{'message': f"Action '{name}' is not restricted"}`

#### `POST /admin/api/db_user_account/edit/{id}`

- **Handler:** `async custom_edit_api(id: str, request: Request)`
- **Source:** `backend/routes/admin_routes.py:23`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** -
- **Return expressions:** `RedirectResponse(url='/admin/db_user_account/list', status_code=303)`

#### `POST /admin/api/db_user_account/edit/{id}/`

- **Handler:** `async custom_edit_api_trailing(id: str, request: Request)`
- **Source:** `backend/routes/admin_routes.py:29`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** -
- **Return expressions:** `RedirectResponse(url='/admin/db_user_account/list', status_code=303)`

#### `POST /api/public/update`

- **Handler:** `async update_public_config(param: config_data)`
- **Source:** `backend/routes/admin_routes.py:38`
- **Summary:** Update public configuration
- **Description:** -
- **Request models:** `config_data`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN]))]`
- **Return expressions:** `await config_controller.getInstance().update_public_config(param)`

#### `DELETE /api/system/image`

- **Handler:** `async update_user(key: str, current_user = Depends(get_current_user))`
- **Source:** `backend/routes/admin_routes.py:46`
- **Summary:** Update system
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.MEMBER]))]`
- **Return expressions:** `await ResourceManager.get_instance().delete_system_image(current_user, key)`

#### `PUT /api/system/image`

- **Handler:** `async upload_system_image(file: UploadFile, key: str = 'logo_url', current_user = Depends(get_current_user))`
- **Source:** `backend/routes/admin_routes.py:54`
- **Summary:** Upload system image
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN]))]`
- **Return expressions:** `await config_controller.getInstance().uploadSystemResource(file, current_user, key)`

### `backend/routes/api_micros.py`

#### `POST /api/cti/fetch`

- **Handler:** `async fetch_cti_label(payload: CTITextRequest, _ = Depends(role_required([user_role.ADMIN, user_role.CRAWLER])))`
- **Source:** `backend/routes/api_micros.py:23`
- **Summary:** -
- **Description:** -
- **Request models:** `CTITextRequest`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.CRAWLER]))]`
- **Return expressions:** `await crawl_model.fetch_cti_label(payload)`

#### `POST /api/nlp/parse/ai`

- **Handler:** `async parse_ai(payload: nlp_data_model, current_user = Depends(get_current_user))`
- **Source:** `backend/routes/api_micros.py:30`
- **Summary:** -
- **Description:** -
- **Request models:** `nlp_data_model`
- **Roles:** -
- **Licenses:** -
- **Settings:** `ai_endpoint_enabled`
- **Include in schema:** `default`
- **Dependencies:** `[Depends(ai_endpoint_required), Depends(role_required([user_role.ADMIN, user_role.CRAWLER])), Depends(limiter_dependency)]`
- **Return expressions:** `await crawl_model.getInstance().parse_chat_ai(payload, user_id=str(current_user.id))`

#### `POST /api/nlp/summarize/ai`

- **Handler:** `async summarize_ai(payload: nlp_data_model, current_user = Depends(get_current_user))`
- **Source:** `backend/routes/api_micros.py:37`
- **Summary:** -
- **Description:** -
- **Request models:** `nlp_data_model`
- **Roles:** -
- **Licenses:** `module:ai`
- **Settings:** `ai_endpoint_enabled`
- **Include in schema:** `default`
- **Dependencies:** `[Depends(ai_endpoint_required), Depends(role_required([user_role.ADMIN, user_role.CRAWLER, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('module:ai', bypass_roles=[user_role.ADMIN])), Depends(limiter_dependency)]`
- **Return expressions:** `await crawl_model.getInstance().parse_summarize_ai(payload, user_id=str(current_user.id))`

#### `POST /api/nlp/chat/report`

- **Handler:** `async chat_report(payload: ReportChatRequest, current_user = Depends(get_current_user))`
- **Source:** `backend/routes/api_micros.py:51`
- **Summary:** Process chat report with NLP
- **Description:** Use NLP pipeline to parse and enrich chat-based report content.
- **Request models:** `ReportChatRequest`
- **Roles:** -
- **Licenses:** -
- **Settings:** `ai_endpoint_enabled`
- **Include in schema:** `False`
- **Dependencies:** `[Depends(ai_endpoint_required), Depends(role_required([user_role.ADMIN])), Depends(limiter_dependency)]`
- **Return expressions:** `response`

#### `POST /api/nexus/chat`

- **Handler:** `async nexus_chat(payload: ReportChatRequest, current_user = Depends(get_current_user))`
- **Source:** `backend/routes/api_micros.py:66`
- **Summary:** Process chat report with Nexus
- **Description:** Use the Nexus chat pipeline to process and respond to chat-based report content.
- **Request models:** `ReportChatRequest`
- **Roles:** -
- **Licenses:** `scanning`
- **Settings:** `ai_endpoint_enabled`
- **Include in schema:** `False`
- **Dependencies:** `[Depends(ai_endpoint_required), Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('scanning')), Depends(limiter_dependency)]`
- **Return expressions:** `response`

#### `POST /api/nexus/analyze-text`

- **Handler:** `async nexus_analyze_text(payload: NexusTextAnalysisRequest, current_user = Depends(get_current_user))`
- **Source:** `backend/routes/api_micros.py:81`
- **Summary:** Analyze text with Nexus OCR classifier
- **Description:** Use the Nexus OCR classifier to analyze text for spam and malicious URLs.
- **Request models:** `NexusTextAnalysisRequest`
- **Roles:** -
- **Licenses:** `module:ai`
- **Settings:** `ai_endpoint_enabled`
- **Include in schema:** `False`
- **Dependencies:** `[Depends(ai_endpoint_required), Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('module:ai', bypass_roles=[user_role.ADMIN])), Depends(limiter_dependency)]`
- **Return expressions:** `await crawl_model.getInstance().analyze_text_with_nexus(payload, user_id=str(current_user.id))`

### `backend/routes/api_routes.py`

#### `POST /api/search/breach`

- **Handler:** `async search_leak(param: search_consolidated_param_model = Body(...), current_user = Depends(get_current_user))`
- **Source:** `backend/routes/api_routes.py:118`
- **Summary:** Search breach reports
- **Description:** -
- **Request models:** `search_consolidated_param_model`
- **Roles:** -
- **Licenses:** `module:breach`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('module:breach'))]`
- **Return expressions:** `await search_model.getInstance().search_consolidated_ranked_result(param, base_index, ['news'], ['leaks', 'tracking'])`, `await search_model.getInstance().search_consolidated_ranked_result(param, base_index, [], [param.category])`

#### `POST /api/search/social`

- **Handler:** `async search_social(param: search_consolidated_param_model = Body(...), current_user = Depends(get_current_user))`
- **Source:** `backend/routes/api_routes.py:140`
- **Summary:** Search social reports
- **Description:** -
- **Request models:** `search_consolidated_param_model`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `GENERAL_MODULE_DEPS`
- **Return expressions:** `await search_model.getInstance().search_consolidated_ranked_result(param, base_index, [], [])`, `await search_model.getInstance().search_consolidated_ranked_result(param, base_index, [], [])`, `await search_model.getInstance().search_consolidated_ranked_result(param, base_index, [], [])`

#### `POST /api/search/exploit`

- **Handler:** `async search_exploit(param: search_consolidated_param_model = Body(...), current_user = Depends(get_current_user))`
- **Source:** `backend/routes/api_routes.py:168`
- **Summary:** Search exploit reports
- **Description:** -
- **Request models:** `search_consolidated_param_model`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `GENERAL_MODULE_DEPS`
- **Return expressions:** `await search_model.getInstance().search_consolidated_ranked_result(param, base_index, [], [param.category])`

#### `POST /api/search/defacement`

- **Handler:** `async search_defacement(param: search_consolidated_param_model = Body(...), current_user = Depends(get_current_user))`
- **Source:** `backend/routes/api_routes.py:184`
- **Summary:** Search defacement reports
- **Description:** -
- **Request models:** `search_consolidated_param_model`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `GENERAL_MODULE_DEPS`
- **Return expressions:** `await search_model.getInstance().search_consolidated_ranked_result(param, base_index, [], [param.category], 'defacement')`

#### `POST /api/feedback/comment/{doc_id}`

- **Handler:** `async add_feedback_comment(doc_id: str, param: feedback_comment_param_model = Body(...), current_user = Depends(get_current_user))`
- **Source:** `backend/routes/api_routes.py:198`
- **Summary:** -
- **Description:** -
- **Request models:** `feedback_comment_param_model`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST]))]`
- **Return expressions:** `await FeedbackManager.get_instance().add_comment(doc_id, param.comment, current_user)`

#### `GET /api/feedback/{doc_id}`

- **Handler:** `async get_feedback(doc_id: str, current_user = Depends(get_current_user))`
- **Source:** `backend/routes/api_routes.py:208`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST]))]`
- **Return expressions:** `await FeedbackManager.get_instance().get_feedback(doc_id, current_user)`

#### `POST /api/feedback/recommended/{doc_id}`

- **Handler:** `async increment_recommended_feedback(doc_id: str, current_user = Depends(get_current_user))`
- **Source:** `backend/routes/api_routes.py:218`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST]))]`
- **Return expressions:** `await FeedbackManager.get_instance().increment_recommended(doc_id, current_user)`

#### `POST /api/feedback/trust/{doc_id}`

- **Handler:** `async increment_trust_feedback(doc_id: str, current_user = Depends(get_current_user))`
- **Source:** `backend/routes/api_routes.py:228`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST]))]`
- **Return expressions:** `await FeedbackManager.get_instance().increment_trust(doc_id, current_user)`

#### `POST /api/feedback/untrust/{doc_id}`

- **Handler:** `async increment_untrust_feedback(doc_id: str, current_user = Depends(get_current_user))`
- **Source:** `backend/routes/api_routes.py:238`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST]))]`
- **Return expressions:** `await FeedbackManager.get_instance().increment_untrust(doc_id, current_user)`

#### `GET /api/user/{user_id}/get`

- **Handler:** `async get_public_user(user_id: str, current_user = Depends(get_current_user))`
- **Source:** `backend/routes/api_routes.py:248`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST]))]`
- **Return expressions:** `await AccountManager.get_instance().get_public_user(user_id, current_user)`

#### `GET /api/user/{user_id}/activity`

- **Handler:** `async get_public_user_activity(user_id: str, current_user = Depends(get_current_user))`
- **Source:** `backend/routes/api_routes.py:258`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST]))]`
- **Return expressions:** `await FeedbackManager.get_instance().get_public_user_activity(user_id, current_user)`

#### `GET /api/directory`

- **Handler:** `async get_directory(param: directory_param_model = Depends())`
- **Source:** `backend/routes/api_routes.py:271`
- **Summary:** Get monitored source directory
- **Description:** -
- **Request models:** `directory_param_model`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST]))]`
- **Return expressions:** `await directory_model.getInstance().invoke_directory(param)`

#### `GET /api/dumps`

- **Handler:** `async get_dumps(param: dump_param_model = Depends())`
- **Source:** `backend/routes/api_routes.py:284`
- **Summary:** Get breach dump catalog
- **Description:** -
- **Request models:** `dump_param_model`
- **Roles:** -
- **Licenses:** `module:dumps`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('module:dumps'))]`
- **Return expressions:** `await dump_model.getInstance().invoke_dump(param)`

#### `GET /api/insight`

- **Handler:** `async get_insight()`
- **Source:** `backend/routes/api_routes.py:297`
- **Summary:** Get system insights
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.DEMO, user_role.ANALYST]))]`
- **Return expressions:** `{'insights': insights, 'latestDocument': latestDocument, 'country_insight': country_insight}`

#### `GET /api/insight/country`

- **Handler:** `async get_country_insight(category: str = Query(...), country: str = Query(...), page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=200))`
- **Source:** `backend/routes/api_routes.py:313`
- **Summary:** Get paginated country insights
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.DEMO, user_role.ANALYST]))]`
- **Return expressions:** `await homepage_model.getInstance().get_country_specific_insights_paginated(category=category, country=country, page=page, limit=limit)`

#### `POST /api/search/stealerlogs`

- **Handler:** `async search_stealerlog(param: search_credential_param_model = Body(...), current_user = Depends(get_current_user))`
- **Source:** `backend/routes/api_routes.py:336`
- **Summary:** Search stealer log reports
- **Description:** -
- **Request models:** `search_credential_param_model`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `STEALER_LOG_DEPS`
- **Return expressions:** `await search_model.getInstance().search_stealerlogs_result(param)`

#### `POST /api/search/stealer/ioc`

- **Handler:** `async search_stealer_iocs(param: search_credential_param_model = Body(...), current_user = Depends(get_current_user))`
- **Source:** `backend/routes/api_routes.py:351`
- **Summary:** Search stealer log reports
- **Description:** -
- **Request models:** `search_credential_param_model`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `STEALER_LOG_DEPS`
- **Return expressions:** `await search_model.getInstance().search_stealer_iocs(param)`

#### `POST /api/search/consolidated`

- **Handler:** `async search_consolidated(param: search_consolidated_param_model = Body(...), current_user = Depends(get_current_user))`
- **Source:** `backend/routes/api_routes.py:367`
- **Summary:** Search consolidated reports (grouped)
- **Description:** -
- **Request models:** `search_consolidated_param_model`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST]))]`
- **Return expressions:** `await search_model.getInstance().search_consolidated_result(param)`

#### `POST /api/search/consolidated/ioc`

- **Handler:** `async search_consolidated_iocs(param: search_consolidated_param_model = Body(...), current_user = Depends(get_current_user))`
- **Source:** `backend/routes/api_routes.py:386`
- **Summary:** Search consolidated reports (ranked with operators)
- **Description:** -
- **Request models:** `search_consolidated_param_model`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST]))]`
- **Return expressions:** `await search_model.getInstance().search_consolidated_iocs(param, base_index)`

#### `GET /api/search/defacement/{doc_id}`

- **Handler:** `async get_defacement_document(doc_id: str)`
- **Source:** `backend/routes/api_routes.py:407`
- **Summary:** Get defacement report
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** `module:defacement`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('module:defacement', bypass_licenses=['maintainer']))]`
- **Return expressions:** `await search_model.getInstance().request_defacement_doc(doc_id)`

#### `GET /api/search/breach/{doc_id}`

- **Handler:** `async get_leak_document(doc_id: str, lang: Optional[str] = Query(None, alias='lang', description='Optional language code for localized report content.'))`
- **Source:** `backend/routes/api_routes.py:421`
- **Summary:** Get breach monitoring report
- **Description:** -
- **Request models:** `Optional[str]`
- **Roles:** -
- **Licenses:** `module:breach`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('module:breach', bypass_licenses=['maintainer']))]`
- **Return expressions:** `await search_model.getInstance().request_leak_doc(doc_id, lang)`

#### `GET /api/search/news/{doc_id}`

- **Handler:** `async get_news_document(doc_id: str, lang: Optional[str] = Query(None, alias='lang', description='Optional language code for localized report content.'))`
- **Source:** `backend/routes/api_routes.py:435`
- **Summary:** Get breach-related news report
- **Description:** -
- **Request models:** `Optional[str]`
- **Roles:** -
- **Licenses:** `module:news`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('module:news', bypass_licenses=['maintainer']))]`
- **Return expressions:** `await search_model.getInstance().request_leak_doc(doc_id, lang)`

#### `GET /api/search/exploit/{doc_id}`

- **Handler:** `async get_exploit_document(doc_id: str, lang: Optional[str] = Query(None, alias='lang', description='Optional language code for localized report content.'))`
- **Source:** `backend/routes/api_routes.py:449`
- **Summary:** Get exploit intelligence report
- **Description:** -
- **Request models:** `Optional[str]`
- **Roles:** -
- **Licenses:** `module:exploit`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('module:exploit', bypass_licenses=['maintainer']))]`
- **Return expressions:** `await search_model.getInstance().request_exploit_doc(doc_id, lang)`

#### `GET /api/search/strategic/{doc_id}`

- **Handler:** `async get_general_document(doc_id: str, lang: Optional[str] = Query(None, alias='lang', description='Optional language code for localized report content.'))`
- **Source:** `backend/routes/api_routes.py:463`
- **Summary:** Get darkweb strategic report
- **Description:** -
- **Request models:** `Optional[str]`
- **Roles:** -
- **Licenses:** `module:general`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('module:general', bypass_licenses=['maintainer']))]`
- **Return expressions:** `await search_model.getInstance().request_general_doc(doc_id, lang)`

#### `GET /api/search/chat/{doc_id}`

- **Handler:** `async get_chat_document(doc_id: str, lang: Optional[str] = Query(None, alias='lang', description='Optional language code for localized report content.'))`
- **Source:** `backend/routes/api_routes.py:477`
- **Summary:** Get chat intelligence report
- **Description:** -
- **Request models:** `Optional[str]`
- **Roles:** -
- **Licenses:** `module:chat`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('module:chat', bypass_licenses=['maintainer']))]`
- **Return expressions:** `await search_model.getInstance().request_chat_doc(doc_id, lang)`

#### `GET /api/search/social/{doc_id}`

- **Handler:** `async get_social_document(doc_id: str, lang: Optional[str] = Query(None, alias='lang', description='Optional language code for localized report content.'))`
- **Source:** `backend/routes/api_routes.py:491`
- **Summary:** Get social_models media intelligence report
- **Description:** -
- **Request models:** `Optional[str]`
- **Roles:** -
- **Licenses:** `module:social`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('module:social', bypass_licenses=['maintainer']))]`
- **Return expressions:** `await search_model.getInstance().request_social_doc(doc_id, lang)`

#### `GET /api/search/breach/screenshot/{filename}`

- **Handler:** `async get_screenshot(filename: str)`
- **Source:** `backend/routes/api_routes.py:505`
- **Summary:** Get breach report screenshot
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** `module:breach`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('module:breach', bypass_licenses=['maintainer']))]`
- **Return expressions:** `await crawl_model.getInstance().get_screenshot_file(f'{filename}.webp')`

#### `POST /api/dynamic/user`

- **Handler:** `async search_dynamic_email(param: search_dynamic_param_model = Body(...), current_user = Depends(get_current_user))`
- **Source:** `backend/routes/api_routes.py:518`
- **Summary:** Dynamic user email exposure search
- **Description:** -
- **Request models:** `search_dynamic_param_model`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `SCANNING_DEPS`
- **Return expressions:** `await search_model.getInstance().dynamic_search(param, 'user', user_id=str(current_user.id))`

#### `POST /api/dynamic/cracked`

- **Handler:** `async search_dynamic_cracked(param: search_dynamic_crack_model = Body(...), current_user = Depends(get_current_user))`
- **Source:** `backend/routes/api_routes.py:532`
- **Summary:** Dynamic cracked credential search
- **Description:** -
- **Request models:** `search_dynamic_crack_model`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `SCANNING_DEPS`
- **Return expressions:** `await search_model.getInstance().dynamic_search(param, 'cracked', user_id=str(current_user.id))`

#### `POST /api/dynamic/software`

- **Handler:** `async search_dynamic_software(param: search_dynamic_crack_model = Body(...), current_user = Depends(get_current_user))`
- **Source:** `backend/routes/api_routes.py:546`
- **Summary:** Dynamic software credential search
- **Description:** -
- **Request models:** `search_dynamic_crack_model`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `SCANNING_DEPS`
- **Return expressions:** `await search_model.getInstance().dynamic_search(param, 'software', user_id=str(current_user.id))`

#### `POST /api/urlscan/domain`

- **Handler:** `async parse_domain_scan(payload: DomainScanRequest, current_user = Depends(get_current_user))`
- **Source:** `backend/routes/api_routes.py:560`
- **Summary:** Domain, SEO, and repository scan
- **Description:** -
- **Request models:** `DomainScanRequest`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `SCAN_WITH_LIMITER_DEPS`
- **Return expressions:** `await _scan_domain_with_type(payload, user_id=str(current_user.id))`

#### `POST /api/urlscan/subdomains`

- **Handler:** `async parse_subdomain_scan(payload: DomainScanRequest, current_user = Depends(get_current_user))`
- **Source:** `backend/routes/api_routes.py:574`
- **Summary:** Returns the list of associated subdomains
- **Description:** -
- **Request models:** `DomainScanRequest`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `SCAN_WITH_LIMITER_DEPS`
- **Return expressions:** `await _scan_domain_with_type(payload, user_id=str(current_user.id), scan_type='subdomains')`

#### `POST /api/urlscan/dns`

- **Handler:** `async parse_dns_scan(payload: DomainScanRequest, current_user = Depends(get_current_user))`
- **Source:** `backend/routes/api_routes.py:588`
- **Summary:** Reverse DNS and ping check
- **Description:** -
- **Request models:** `DomainScanRequest`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `SCAN_WITH_LIMITER_DEPS`
- **Return expressions:** `await _scan_domain_with_type(payload, user_id=str(current_user.id), scan_type='dns')`

#### `POST /api/urlscan/wayback`

- **Handler:** `async parse_wayback_scan(payload: DomainScanRequest, current_user = Depends(get_current_user))`
- **Source:** `backend/routes/api_routes.py:602`
- **Summary:** Fetches archived snapshots and timestamps
- **Description:** -
- **Request models:** `DomainScanRequest`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `SCAN_WITH_LIMITER_DEPS`
- **Return expressions:** `await _scan_domain_with_type(payload, user_id=str(current_user.id), scan_type='wayback')`

#### `POST /api/urlscan/ip`

- **Handler:** `async parse_ip(payload: IPScanRequest, current_user = Depends(get_current_user))`
- **Source:** `backend/routes/api_routes.py:612`
- **Summary:** -
- **Description:** -
- **Request models:** `IPScanRequest`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `SCAN_WITH_LIMITER_DEPS`
- **Return expressions:** `await crawl_model.getInstance().scan_ip(payload, user_id=str(current_user.id))`

#### `POST /api/social/scrape`

- **Handler:** `async scrape_social(payload: SocialScrapeRequest, current_user = Depends(get_current_user))`
- **Source:** `backend/routes/api_routes.py:621`
- **Summary:** -
- **Description:** -
- **Request models:** `SocialScrapeRequest`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `SCAN_WITH_LIMITER_DEPS`
- **Return expressions:** `await crawl_model.getInstance().scrape_social(payload, user_id=str(current_user.id))`

#### `POST /api/dynamic/social`

- **Handler:** `async search_dynamic_social(param: search_dynamic_social_model = Body(...), current_user = Depends(get_current_user))`
- **Source:** `backend/routes/api_routes.py:635`
- **Summary:** Dynamic social_models identifier exposure search
- **Description:** -
- **Request models:** `search_dynamic_social_model`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `SCANNING_DEPS`
- **Return expressions:** `await search_model.getInstance().dynamic_search(param, 'social', user_id=str(current_user.id))`

#### `POST /api/index/injection`

- **Handler:** `async index_injection(payload: InjectionBatchRequestModel = Body(...), current_user = Depends(get_current_user))`
- **Source:** `backend/routes/api_routes.py:64`
- **Summary:** Batch inject SIEM logs
- **Description:** Ingest multiple SIEM/raw log records into the SIEM index in a single request. Each item in `logs` becomes one upserted SIEM document keyed from the authenticated user's tenant and the raw log text. `tenant_id` is injected from the current user and is not accepted from the request body.
- **Request models:** `InjectionBatchRequestModel`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.CRAWLER])), Depends(limiter_dependency)]`
- **Return expressions:** `await SiemLogManager.get_instance().inject_logs(payload, current_user)`

#### `POST /api/dynamic/wanted`

- **Handler:** `async search_dynamic_wanted(param: search_dynamic_social_model = Body(...), current_user = Depends(get_current_user))`
- **Source:** `backend/routes/api_routes.py:648`
- **Summary:** Searches wanted people around the Globe
- **Description:** -
- **Request models:** `search_dynamic_social_model`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `SCANNING_DEPS`
- **Return expressions:** `await search_model.getInstance().search_wanted_list(param)`

#### `POST /api/dynamic/national-identity`

- **Handler:** `async search_dynamic_national_identity(param: search_dynamic_crack_model = Body(...), current_user = Depends(get_current_user))`
- **Source:** `backend/routes/api_routes.py:661`
- **Summary:** Dynamic national identity search
- **Description:** -
- **Request models:** `search_dynamic_crack_model`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `SCANNING_DEPS`
- **Return expressions:** `await search_model.getInstance().dynamic_search(param, 'pak_database', user_id=str(current_user.id))`

#### `GET /api/search/breach/stix/{doc_id}`

- **Handler:** `async get_breach_stix_document(doc_id: str, lang: Optional[str] = Query(None, alias='lang', description='Optional language code for localized report content.'))`
- **Source:** `backend/routes/api_routes.py:676`
- **Summary:** Get breach media intelligence report in stix format
- **Description:** -
- **Request models:** `Optional[str]`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER]))]`
- **Return expressions:** `await stix_manager.get_instance().get_leak_stix(doc_id, lang)`

#### `GET /api/search/strategic/stix/{doc_id}`

- **Handler:** `async get_strategic_stix_document(doc_id: str, lang: Optional[str] = Query(None, alias='lang', description='Optional language code for localized report content.'))`
- **Source:** `backend/routes/api_routes.py:692`
- **Summary:** Get strategic media intelligence report in stix format
- **Description:** -
- **Request models:** `Optional[str]`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER]))]`
- **Return expressions:** `await stix_manager.get_instance().get_general_stix(doc_id, lang)`

#### `GET /api/search/defacement/stix/{doc_id}`

- **Handler:** `async get_defacement_stix_document(doc_id: str)`
- **Source:** `backend/routes/api_routes.py:708`
- **Summary:** Get defacement media intelligence report in stix format
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER]))]`
- **Return expressions:** `await stix_manager.get_instance().get_defacement_stix(doc_id)`

#### `GET /api/search/exploit/stix/{doc_id}`

- **Handler:** `async get_exploit_stix_document(doc_id: str, lang: Optional[str] = Query(None, alias='lang', description='Optional language code for localized report content.'))`
- **Source:** `backend/routes/api_routes.py:723`
- **Summary:** Get exploit media intelligence report in stix format
- **Description:** -
- **Request models:** `Optional[str]`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER]))]`
- **Return expressions:** `await stix_manager.get_instance().get_exploit_stix(doc_id, lang)`

#### `GET /api/search/social/stix/{doc_id}`

- **Handler:** `async get_social_stix_document(doc_id: str, lang: Optional[str] = Query(None, alias='lang', description='Optional language code for localized report content.'))`
- **Source:** `backend/routes/api_routes.py:737`
- **Summary:** Get social_models media intelligence report in stix format
- **Description:** -
- **Request models:** `Optional[str]`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `STIX_MEMBER_DEPS`
- **Return expressions:** `await stix_manager.get_instance().get_social_stix(doc_id, lang)`

#### `GET /api/search/chat/stix/{doc_id}`

- **Handler:** `async get_chat_stix_document(doc_id: str, lang: Optional[str] = Query(None, alias='lang', description='Optional language code for localized report content.'))`
- **Source:** `backend/routes/api_routes.py:751`
- **Summary:** Get social_models media intelligence report in stix format
- **Description:** -
- **Request models:** `Optional[str]`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `STIX_MEMBER_DEPS`
- **Return expressions:** `await stix_manager.get_instance().get_chat_stix(doc_id, lang)`

#### `GET /api/graph`

- **Handler:** `async get_entity_relations(query: EntityQueryModel = Depends())`
- **Source:** `backend/routes/api_routes.py:766`
- **Summary:** Get entity graph relationships
- **Description:** Fetch graph relationships for a given entity based on its type and value.
- **Request models:** `EntityQueryModel`
- **Roles:** -
- **Licenses:** `cti_graph`
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(license_required('cti_graph'))]`
- **Return expressions:** `await manager.get_entity_relations(query)`

#### `POST /api/profile/event-management/siem/search`

- **Handler:** `async search_siem_logs(payload: SiemSearchRequestModel = Body(...), current_user = Depends(get_current_user))`
- **Source:** `backend/routes/api_routes.py:78`
- **Summary:** Search SIEM logs
- **Description:** Search SIEM log records for the authenticated user tenant. Admin and maintainer users can search events only within their own tenant scope.
- **Request models:** `SiemSearchRequestModel`
- **Roles:** -
- **Licenses:** `maintainer`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.MEMBER])), Depends(license_required('maintainer', bypass_roles=[user_role.ADMIN])), Depends(limiter_dependency)]`
- **Return expressions:** `await SiemLogManager.get_instance().search_logs(payload, current_user)`

#### `GET /api/search/news/stix/{doc_id}`

- **Handler:** `async get_news_stix_document(doc_id: str, lang: Optional[str] = Query(None, alias='lang', description='Optional language code for localized report content.'))`
- **Source:** `backend/routes/api_routes.py:782`
- **Summary:** Get news media intelligence report in stix format
- **Description:** -
- **Request models:** `Optional[str]`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER]))]`
- **Return expressions:** `await stix_manager.get_instance().get_leak_stix(doc_id, lang)`

#### `POST /api/ioc/extract`

- **Handler:** `async extract_ioc(file: UploadFile = File(...), current_user = Depends(get_current_user))`
- **Source:** `backend/routes/api_routes.py:799`
- **Summary:** Extract IOCs from file(.pdf or .txt) or image(.png, .jpg or .jpeg)
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** `scanning`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST, Depends(license_required('scanning'))]))]`
- **Return expressions:** `result`

#### `POST /api/apk/scan`

- **Handler:** `async scan_apk(file: UploadFile = File(...), current_user = Depends(get_current_user))`
- **Source:** `backend/routes/api_routes.py:816`
- **Summary:** Dynamic analysis scan to identify application metadata, cracking indicators, etc
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** `scanning`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('scanning'))]`
- **Return expressions:** `result`

#### `POST /api/crypto/scan`

- **Handler:** `async crypto_scan(param: search_dynamic_crypto_model = Body(...), current_user = Depends(get_current_user))`
- **Source:** `backend/routes/api_routes.py:836`
- **Summary:** Scan cryptocurrency wallet address or transaction hash
- **Description:** -
- **Request models:** `search_dynamic_crypto_model`
- **Roles:** -
- **Licenses:** `scanning`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('scanning'))]`
- **Return expressions:** `await search_model.getInstance().dynamic_search(param, 'crypto', user_id=str(current_user.id))`

#### `POST /api/cross/search`

- **Handler:** `async cross_search(param: search_dynamic_onion_search = Body(...), current_user = Depends(get_current_user))`
- **Source:** `backend/routes/api_routes.py:853`
- **Summary:** Run Cross Search
- **Description:** -
- **Request models:** `search_dynamic_onion_search`
- **Roles:** -
- **Licenses:** `scanning`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('scanning'))]`
- **Return expressions:** `await search_model.getInstance().onion_search(param, user_id=str(current_user.id))`

#### `POST /api/netintel/resolve_ip`

- **Handler:** `async resolve_ip(param: ResolveIPRequest = Body(...), current_user = Depends(get_current_user))`
- **Source:** `backend/routes/api_routes.py:867`
- **Summary:** Resolve a domain to IP addresses
- **Description:** -
- **Request models:** `ResolveIPRequest`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `SCANNING_DEPS`
- **Return expressions:** `await search_model.getInstance().network_intel(param, 'resolve_ip', user_id=str(current_user.id))`

#### `POST /api/netintel/ipscanner`

- **Handler:** `async ipscanner(param: NetIntelDeepScanRequest = Body(...), current_user = Depends(get_current_user))`
- **Source:** `backend/routes/api_routes.py:881`
- **Summary:** Scan an IP address for network intelligence
- **Description:** -
- **Request models:** `NetIntelDeepScanRequest`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `SCANNING_DEPS`
- **Return expressions:** `await search_model.getInstance().network_intel(param, 'netintel_scanner', user_id=str(current_user.id))`

#### `POST /api/netintel/url_vulnerability_scan`

- **Handler:** `async url_vulnerability_scan(param: UrlVulnerabilityScanRequest = Body(...), current_user = Depends(get_current_user))`
- **Source:** `backend/routes/api_routes.py:895`
- **Summary:** Scan a domain URL for web vulnerabilities
- **Description:** -
- **Request models:** `UrlVulnerabilityScanRequest`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `SCAN_WITH_LIMITER_DEPS`
- **Return expressions:** `await search_model.getInstance().network_intel(param, 'url_vulnerability_scan', user_id=str(current_user.id))`

#### `POST /api/netintel/iot_detect`

- **Handler:** `async geo_camera_detect(param: GeoCameraDetectRequest = Body(...), current_user = Depends(get_current_user))`
- **Source:** `backend/routes/api_routes.py:909`
- **Summary:** Scan a geographic area for exposed cameras
- **Description:** -
- **Request models:** `GeoCameraDetectRequest`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `SCANNING_DEPS`
- **Return expressions:** `await search_model.getInstance().network_intel(param, 'iot_detect', user_id=str(current_user.id))`

#### `POST /api/search/strategic`

- **Handler:** `async search_general(param: search_consolidated_param_model = Body(...), current_user = Depends(get_current_user), role: user_role = Depends(get_current_role), is_free: bool = Depends(get_is_free_token))`
- **Source:** `backend/routes/api_routes.py:91`
- **Summary:** Search strategic reports
- **Description:** -
- **Request models:** `search_consolidated_param_model`, `user_role`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `GENERAL_MODULE_DEPS`
- **Return expressions:** `await search_model.getInstance().search_consolidated_ranked_result(param, base_index, [], [])`

#### `POST /api/netintel/camera_detect_ranges`

- **Handler:** `async geo_camera_detect_ranges(param: GeoCameraDetectRangesRequest = Body(...), current_user = Depends(get_current_user))`
- **Source:** `backend/routes/api_routes.py:924`
- **Summary:** Scan IP ranges for exposed cameras
- **Description:** -
- **Request models:** `GeoCameraDetectRangesRequest`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `SCANNING_DEPS`
- **Return expressions:** `await search_model.getInstance().network_intel(param, 'camera_detect_ranges', user_id=str(current_user.id))`

#### `POST /api/stix/convert/{kind}`

- **Handler:** `async convert_stix_single(kind: str, payload: dict = Body(...))`
- **Source:** `backend/routes/api_routes.py:938`
- **Summary:** Convert Orion document payload to STIX 2.1 bundle
- **Description:** -
- **Request models:** `dict`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `STIX_MEMBER_DEPS`
- **Return expressions:** `convert_to_stix(kind_normalized, payload)`, `{'error': 'Unsupported STIX kind', 'supported_kinds': sorted(STIX_KIND_VALUES)}`

#### `POST /api/stix/convert/{kind}/batch`

- **Handler:** `async convert_stix_batch(kind: str, payloads: list[dict] = Body(...))`
- **Source:** `backend/routes/api_routes.py:954`
- **Summary:** Convert multiple Orion payloads to STIX 2.1 bundles
- **Description:** -
- **Request models:** `list[dict]`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `STIX_MEMBER_DEPS`
- **Return expressions:** `{'items': [convert_to_stix(kind_normalized, payload) for payload in payloads]}`, `{'error': 'Unsupported STIX kind', 'supported_kinds': sorted(STIX_KIND_VALUES)}`

### `backend/routes/auth_routes.py`

#### `POST /api/verify/{token}`

- **Handler:** `async verifyUser(token: str)`
- **Source:** `backend/routes/auth_routes.py:103`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** -
- **Return expressions:** `await auth_manager.verify_user(token)`

#### `POST /api/forgot`

- **Handler:** `async forgotPassword(request: ForgotPasswordRequest)`
- **Source:** `backend/routes/auth_routes.py:108`
- **Summary:** -
- **Description:** -
- **Request models:** `ForgotPasswordRequest`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** -
- **Return expressions:** `await auth_manager.forgot_password(request.email)`

#### `POST /api/subscription/request`

- **Handler:** `async subscriptionRequest(request: PaymentParamModel)`
- **Source:** `backend/routes/auth_routes.py:113`
- **Summary:** -
- **Description:** -
- **Request models:** `PaymentParamModel`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** -
- **Return expressions:** `await PaymentManager.get_instance().send_subscription_info(request)`

#### `POST /api/updatePassword`

- **Handler:** `async updatePassword(data: ResetPassword)`
- **Source:** `backend/routes/auth_routes.py:118`
- **Summary:** -
- **Description:** -
- **Request models:** `ResetPassword`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** -
- **Return expressions:** `await auth_manager.update_password(data.token, data.password)`

#### `POST /api/support`

- **Handler:** `async support(data: SupportRequest)`
- **Source:** `backend/routes/auth_routes.py:122`
- **Summary:** -
- **Description:** -
- **Request models:** `SupportRequest`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** -
- **Return expressions:** `await SignupManager.send_support_mail(data)`

#### `POST /api/token`

- **Handler:** `async token(form_data: OAuth2PasswordRequestForm = Depends(), response: Response = None)`
- **Source:** `backend/routes/auth_routes.py:34`
- **Summary:** -
- **Description:** -
- **Request models:** `OAuth2PasswordRequestForm`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** -
- **Return expressions:** `result`

#### `POST /api/token/demo`

- **Handler:** `async token_demo(response: Response = None)`
- **Source:** `backend/routes/auth_routes.py:46`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** -
- **Return expressions:** `result`

#### `POST /api/token/2fa/verify`

- **Handler:** `async verify_2fa(code: str = Body(..., embed=True), ptoken: str = Depends(oauth2_scheme), response: Response = None)`
- **Source:** `backend/routes/auth_routes.py:61`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** -
- **Return expressions:** `result`

#### `POST /api/token/refresh`

- **Handler:** `async refresh_token(request: Request, response: Response = None)`
- **Source:** `backend/routes/auth_routes.py:72`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** -
- **Return expressions:** `result`

#### `POST /api/logout`

- **Handler:** `async logout(request: Request)`
- **Source:** `backend/routes/auth_routes.py:84`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** -
- **Return expressions:** `resp`

#### `POST /api/signup`

- **Handler:** `async signup(data: SignupRequest)`
- **Source:** `backend/routes/auth_routes.py:93`
- **Summary:** -
- **Description:** -
- **Request models:** `SignupRequest`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** -
- **Return expressions:** `await SignupManager.signup_user(data)`

#### `POST /api/signup/verificaion`

- **Handler:** `async signup(data: SignupRequest)`
- **Source:** `backend/routes/auth_routes.py:98`
- **Summary:** -
- **Description:** -
- **Request models:** `SignupRequest`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** -
- **Return expressions:** `await SignupManager.resend_verification_email(data)`

### `backend/routes/crawl_routes.py`

#### `POST /api/profile/feeder/scripts/{script_id}/delete-value`

- **Handler:** `async delete_feeder_value(script_id: str, data: FeederValueDeleteRequest, current_user = Depends(get_current_user))`
- **Source:** `backend/routes/crawl_routes.py:100`
- **Summary:** -
- **Description:** -
- **Request models:** `FeederValueDeleteRequest`
- **Roles:** -
- **Licenses:** `module:feeder`
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(license_required('module:feeder'))]`
- **Return expressions:** `await FeederManager.get_instance().delete_value(script_id, data, current_user)`

#### `POST /api/profile/feeder/scripts/{script_id}/toggle`

- **Handler:** `async toggle_feeder_script(script_id: str, current_user = Depends(get_current_user))`
- **Source:** `backend/routes/crawl_routes.py:108`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** `module:feeder`
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(license_required('module:feeder'))]`
- **Return expressions:** `await FeederManager.get_instance().toggle_script_enabled(script_id, current_user)`

#### `POST /api/profile/feeder/scripts/{script_id}/owner`

- **Handler:** `async transfer_feeder_script_owner(script_id: str, data: FeederOwnerTransferRequest, current_user = Depends(get_current_user))`
- **Source:** `backend/routes/crawl_routes.py:116`
- **Summary:** -
- **Description:** -
- **Request models:** `FeederOwnerTransferRequest`
- **Roles:** -
- **Licenses:** `module:feeder`
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN])), Depends(license_required('module:feeder'))]`
- **Return expressions:** `await FeederManager.get_instance().transfer_script_owner(script_id, data, current_user)`

#### `POST /api/profile/feeder/upload`

- **Handler:** `async upload_feeder_script(rule_key: str = Form(...), mode: str = Form(...), values_text: str | None = Form(None), file: UploadFile | None = File(None), current_user = Depends(get_current_user))`
- **Source:** `backend/routes/crawl_routes.py:124`
- **Summary:** -
- **Description:** -
- **Request models:** `UploadFile | None`, `str | None`
- **Roles:** -
- **Licenses:** `module:feeder`
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(license_required('module:feeder'))]`
- **Return expressions:** `await FeederManager.get_instance().upload_script(rule_key, mode, file, values_text, current_user)`

#### `POST /api/feeder/status`

- **Handler:** `async update_feeder_script_status(data: FeederScriptStatusUpdateRequest)`
- **Source:** `backend/routes/crawl_routes.py:136`
- **Summary:** -
- **Description:** -
- **Request models:** `FeederScriptStatusUpdateRequest`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.CRAWLER])), Depends(limiter_dependency)]`
- **Return expressions:** `await FeederManager.get_instance().update_script_status_by_name(data)`

#### `POST /api/index/leak`

- **Handler:** `async index_leak_data(request: Request)`
- **Source:** `backend/routes/crawl_routes.py:146`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `_leak_deps`
- **Return expressions:** `await _index(request, LeakDataModel, instance.invoke_leak_index)`

#### `POST /api/index/news`

- **Handler:** `async index_news_data(request: Request)`
- **Source:** `backend/routes/crawl_routes.py:152`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `_leak_deps`
- **Return expressions:** `await _index(request, LeakDataModel, instance.invoke_news_index)`

#### `POST /api/index/tracking`

- **Handler:** `async index_tracking_data(request: Request)`
- **Source:** `backend/routes/crawl_routes.py:158`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `_leak_deps`
- **Return expressions:** `await _index(request, LeakDataModel, instance.invoke_tracking_index)`

#### `POST /api/index/exploit`

- **Handler:** `async index_exploit_data(request: Request)`
- **Source:** `backend/routes/crawl_routes.py:164`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `_leak_deps`
- **Return expressions:** `await _index(request, ExploitDataModel, instance.invoke_exploit_index)`

#### `POST /api/index/defacement`

- **Handler:** `async index_defacement_data(request: Request)`
- **Source:** `backend/routes/crawl_routes.py:171`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.CRAWLER])), Depends(limiter_dependency)]`
- **Return expressions:** `await crawl_model.getInstance().invoke_defacement_index(DefacementDataModel(**body))`

#### `POST /api/screenshot`

- **Handler:** `async screenshot(payload: ScreenshotPayload, _ = Depends(role_required([user_role.ADMIN, user_role.CRAWLER])))`
- **Source:** `backend/routes/crawl_routes.py:179`
- **Summary:** -
- **Description:** -
- **Request models:** `ScreenshotPayload`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.CRAWLER])), Depends(limiter_dependency)]`
- **Return expressions:** `await crawl_model.getInstance().invoke_file_upload(payload)`

#### `POST /api/index/generic`

- **Handler:** `async index_generic(request: Request)`
- **Source:** `backend/routes/crawl_routes.py:186`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.CRAWLER])), Depends(limiter_dependency)]`
- **Return expressions:** `await crawl_model.getInstance().invoke_generic_index(GeneralDataModel(**body))`

#### `POST /api/nlp/parse`

- **Handler:** `async parse_text(payload: nlp_data_model)`
- **Source:** `backend/routes/crawl_routes.py:194`
- **Summary:** -
- **Description:** -
- **Request models:** `nlp_data_model`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.CRAWLER])), Depends(limiter_dependency)]`
- **Return expressions:** `await crawl_model.getInstance().parse_chat(payload)`

#### `POST /api/index/chat`

- **Handler:** `async index_chat_data(request: Request)`
- **Source:** `backend/routes/crawl_routes.py:201`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.CRAWLER])), Depends(limiter_dependency)]`
- **Return expressions:** `await crawl_model.getInstance().invoke_chat_index(chat_data_model(**body))`

#### `POST /api/index/social`

- **Handler:** `async index_social_data(request: Request)`
- **Source:** `backend/routes/crawl_routes.py:207`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.CRAWLER]))]`
- **Return expressions:** `await crawl_model.getInstance().invoke_social_index(social_data_model(**body))`

#### `POST /api/index/swarm`

- **Handler:** `async index_swarm_data(request: Request)`
- **Source:** `backend/routes/crawl_routes.py:213`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(limiter_dependency)]`
- **Return expressions:** `await crawl_model.getInstance().proxy_swarm_index(request)`

#### `POST /api/index/sanctions`

- **Handler:** `async index_sanctions_data(request: Request)`
- **Source:** `backend/routes/crawl_routes.py:218`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `_leak_deps`
- **Return expressions:** `await instance.invoke_sanctions_index(open_sanctions_data_model(**body))`, `await instance.invoke_sanctions_index(records)`, `await instance.invoke_sanctions_index(records)`, `await instance.invoke_sanctions_index(records)`

#### `POST /api/index/entity`

- **Handler:** `async index_entities(_: Request, entities: List[entity_model] = Body(...))`
- **Source:** `backend/routes/crawl_routes.py:249`
- **Summary:** -
- **Description:** -
- **Request models:** `List[entity_model]`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.CRAWLER])), Depends(limiter_dependency)]`
- **Return expressions:** `results`

#### `GET /api/feeder/{index_type}`

- **Handler:** `async feeder(index_type: str)`
- **Source:** `backend/routes/crawl_routes.py:25`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.CRAWLER])), Depends(limiter_dependency)]`
- **Return expressions:** `await crawl_model.getInstance().invoke_fetch_feeder(index_type)`

#### `POST /api/index/dump`

- **Handler:** `async index_dump(request: Request)`
- **Source:** `backend/routes/crawl_routes.py:258`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(limiter_dependency)]`
- **Return expressions:** `await crawl_model.getInstance().invoke_dump_index(DumpModel(**body))`

#### `POST /api/index/stealerlog`

- **Handler:** `async index_stealerlog(model: LogBatchModel)`
- **Source:** `backend/routes/crawl_routes.py:264`
- **Summary:** -
- **Description:** -
- **Request models:** `LogBatchModel`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(limiter_dependency)]`
- **Return expressions:** `await crawl_model.getInstance().invoke_stealerlog_index(model)`

#### `GET /api/parser`

- **Handler:** `async parser()`
- **Source:** `backend/routes/crawl_routes.py:31`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** -
- **Return expressions:** `await crawl_model.getInstance().invoke_fetch_parser()`

#### `GET /api/profile/feeder/catalog`

- **Handler:** `async get_feeder_catalog(current_user = Depends(get_current_user))`
- **Source:** `backend/routes/crawl_routes.py:39`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** `module:feeder`
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(license_required('module:feeder'))]`
- **Return expressions:** `await FeederManager.get_instance().get_catalog(current_user)`

#### `GET /api/profile/feeder/scripts`

- **Handler:** `async get_feeder_scripts(rule_key: str | None = None, entry_type: str | None = None, page: int = 1, limit: int = 1000, current_user = Depends(get_current_user))`
- **Source:** `backend/routes/crawl_routes.py:47`
- **Summary:** -
- **Description:** -
- **Request models:** `str | None`
- **Roles:** -
- **Licenses:** `module:feeder`
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(license_required('module:feeder'))]`
- **Return expressions:** `await FeederManager.get_instance().list_scripts(current_user, rule_key=rule_key, page=page, limit=limit, entry_type=entry_type)`

#### `GET /api/profile/feeder/users`

- **Handler:** `async get_feeder_owner_users(_current_user = Depends(get_current_user))`
- **Source:** `backend/routes/crawl_routes.py:60`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** `module:feeder`
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN])), Depends(license_required('module:feeder'))]`
- **Return expressions:** `await FeederManager.get_instance().list_owner_users()`

#### `POST /api/profile/feeder/scripts/clear-all`

- **Handler:** `async clear_feeder_scripts(rule_key: str, current_user = Depends(get_current_user))`
- **Source:** `backend/routes/crawl_routes.py:68`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** `module:feeder`
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(license_required('module:feeder'))]`
- **Return expressions:** `await FeederManager.get_instance().clear_scripts(rule_key, current_user)`

#### `POST /api/profile/feeder/scripts/enable-all`

- **Handler:** `async enable_feeder_scripts(rule_key: str, current_user = Depends(get_current_user))`
- **Source:** `backend/routes/crawl_routes.py:76`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** `module:feeder`
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(license_required('module:feeder'))]`
- **Return expressions:** `await FeederManager.get_instance().set_rule_enabled(rule_key, True, current_user)`

#### `POST /api/profile/feeder/scripts/disable-all`

- **Handler:** `async disable_feeder_scripts(rule_key: str, current_user = Depends(get_current_user))`
- **Source:** `backend/routes/crawl_routes.py:84`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** `module:feeder`
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(license_required('module:feeder'))]`
- **Return expressions:** `await FeederManager.get_instance().set_rule_enabled(rule_key, False, current_user)`

#### `POST /api/profile/feeder/scripts/{script_id}/delete`

- **Handler:** `async delete_feeder_script(script_id: str, current_user = Depends(get_current_user))`
- **Source:** `backend/routes/crawl_routes.py:92`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** `module:feeder`
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(license_required('module:feeder'))]`
- **Return expressions:** `await FeederManager.get_instance().delete_script(script_id, current_user)`

### `backend/routes/public_api_routes.py`

#### `GET /api/public`

- **Handler:** `async get_public_config()`
- **Source:** `backend/routes/public_api_routes.py:24`
- **Summary:** Get public configuration
- **Description:** Get public configuration values used for frontend initialization.
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[]`
- **Return expressions:** `await config_controller.getInstance().get_system_info()`

#### `GET /api/s/static/tenant/{id}`

- **Handler:** `async get_tenant_resource(id: str)`
- **Source:** `backend/routes/public_api_routes.py:29`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(cookie_required)]`
- **Return expressions:** `await ResourceManager.get_instance().get_tenant_image(id)`

#### `GET /api/s/static/user/{id}`

- **Handler:** `async get_user_resource(id: str)`
- **Source:** `backend/routes/public_api_routes.py:34`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(cookie_required)]`
- **Return expressions:** `await ResourceManager.get_instance().get_user_image(id)`

#### `GET /api/s/static/favicon`

- **Handler:** `async get_system_resource()`
- **Source:** `backend/routes/public_api_routes.py:39`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** -
- **Return expressions:** `await ResourceManager.get_instance().get_favicon()`

#### `GET /api/s/static/system/{id}`

- **Handler:** `async get_system_resource(request: Request, id: str)`
- **Source:** `backend/routes/public_api_routes.py:43`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** -
- **Return expressions:** `await ResourceManager.get_instance().get_system_image(id)`

#### `GET /robots.txt`

- **Handler:** `async robots_txt()`
- **Source:** `backend/routes/public_api_routes.py:47`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** -
- **Return expressions:** `await ResourceManager.get_instance().get_robots_txt()`

#### `GET /api/search/stealerlogs`

- **Handler:** `async search_stealerlog(q: str = Query(...))`
- **Source:** `backend/routes/public_api_routes.py:55`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** -
- **Return expressions:** `await search_model.getInstance().search_stealerlogs_persona_breach(param)`

### `backend/routes/social_routes.py`

#### `POST /api/social/followers`

- **Handler:** `async search_dynamic_followers(param: SocialFollowersRequest = Body(...))`
- **Source:** `backend/routes/social_routes.py:104`
- **Summary:** Scrapes the followers of requested social account
- **Description:** -
- **Request models:** `SocialFollowersRequest`
- **Roles:** -
- **Licenses:** `scanning`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('scanning'))]`
- **Return expressions:** `await graphs_model.getInstance().social_search(param, 'followers')`

#### `POST /api/social/following`

- **Handler:** `async search_dynamic_following(param: SocialFollowingRequest = Body(...))`
- **Source:** `backend/routes/social_routes.py:117`
- **Summary:** Scrapes the following of requested social account
- **Description:** -
- **Request models:** `SocialFollowingRequest`
- **Roles:** -
- **Licenses:** `scanning`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('scanning'))]`
- **Return expressions:** `await graphs_model.getInstance().social_search(param, 'following')`

#### `POST /api/social/posts`

- **Handler:** `async search_dynamic_posts(param: SocialProfileRequest = Body(...))`
- **Source:** `backend/routes/social_routes.py:130`
- **Summary:** Scrapes the posts of requested social account
- **Description:** -
- **Request models:** `SocialProfileRequest`
- **Roles:** -
- **Licenses:** `scanning`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('scanning'))]`
- **Return expressions:** `await graphs_model.getInstance().social_search(param, 'posts')`

#### `POST /api/social/entity`

- **Handler:** `async search_dynamic_entity(param: SocialProfileRequest = Body(...))`
- **Source:** `backend/routes/social_routes.py:138`
- **Summary:** -
- **Description:** -
- **Request models:** `SocialProfileRequest`
- **Roles:** -
- **Licenses:** `scanning`
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('scanning'))]`
- **Return expressions:** `await graphs_model.getInstance().social_search(param, 'entity')`

#### `POST /api/social/metadata`

- **Handler:** `async search_social_metadata(param: SocialMetadataRequest = Body(...))`
- **Source:** `backend/routes/social_routes.py:151`
- **Summary:** Search for specific keyword combinations linked to a username across social platforms.
- **Description:** -
- **Request models:** `SocialMetadataRequest`
- **Roles:** -
- **Licenses:** `scanning`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('scanning'))]`
- **Return expressions:** `await search_model.getInstance().social_search(param, 'metadata')`

#### `POST /api/social/session/upsert`

- **Handler:** `async upsert_social_session(data: dict = Body(...), graph_type: str = Query('social'), current_user = Depends(get_current_user))`
- **Source:** `backend/routes/social_routes.py:159`
- **Summary:** -
- **Description:** -
- **Request models:** `dict`
- **Roles:** -
- **Licenses:** `scanning`
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('scanning', bypass_licenses=['osint_advanced']))]`
- **Return expressions:** `await graphs_model.getInstance().upsert_data(str(current_user.id), gt, data)`

#### `GET /api/social/session/tabs`

- **Handler:** `async get_social_tabs(graph_type: str = Query('social'), current_user = Depends(get_current_user))`
- **Source:** `backend/routes/social_routes.py:168`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** `scanning`
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('scanning', bypass_licenses=['osint_advanced', 'social_mapper']))]`
- **Return expressions:** `await graphs_model.getInstance().get_tabs_summary(str(current_user.id), graph_type)`

#### `POST /api/social/session/tab/add`

- **Handler:** `async add_social_tab(tab: dict = Body(...), graph_type: str = Query('social'), current_user = Depends(get_current_user))`
- **Source:** `backend/routes/social_routes.py:176`
- **Summary:** -
- **Description:** -
- **Request models:** `dict`
- **Roles:** -
- **Licenses:** `scanning`
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('scanning', bypass_licenses=['osint_advanced']))]`
- **Return expressions:** `await graphs_model.getInstance().add_tab(str(current_user.id), gt, tab)`

#### `POST /api/social/recon`

- **Handler:** `async search_dynamic_email(param: SocialReconRequest = Body(...))`
- **Source:** `backend/routes/social_routes.py:31`
- **Summary:** Cross-platform identity search to locate a user's digital footprint
- **Description:** -
- **Request models:** `SocialReconRequest`
- **Roles:** -
- **Licenses:** `scanning`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('scanning'))]`
- **Return expressions:** `await search_model.getInstance().social_search(param, 'recon')`

#### `POST /api/social/phone/recon`

- **Handler:** `async search_dynamic_phone_recon(param: SocialReconRequest = Body(...))`
- **Source:** `backend/routes/social_routes.py:39`
- **Summary:** -
- **Description:** -
- **Request models:** `SocialReconRequest`
- **Roles:** -
- **Licenses:** `scanning`
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('scanning'))]`
- **Return expressions:** `await search_model.getInstance().social_search(param, 'phone')`

#### `POST /api/social/profile`

- **Handler:** `async search_dynamic_profile(param: SocialProfileRequest = Body(...))`
- **Source:** `backend/routes/social_routes.py:52`
- **Summary:** Scrapes the profile of requested social account
- **Description:** -
- **Request models:** `SocialProfileRequest`
- **Roles:** -
- **Licenses:** `scanning`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('scanning'))]`
- **Return expressions:** `await search_model.getInstance().social_search(param, 'profile')`

#### `POST /api/social/online/images`

- **Handler:** `async search_dynamic_online_images(param: SocialOnlineImages = Body(...))`
- **Source:** `backend/routes/social_routes.py:65`
- **Summary:** Scrapes the images of requested social account
- **Description:** -
- **Request models:** `SocialOnlineImages`
- **Roles:** -
- **Licenses:** `scanning`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('scanning'))]`
- **Return expressions:** `await search_model.getInstance().social_search(param, 'online/images')`

#### `POST /api/social/recon/image`

- **Handler:** `async search_dynamic_image(payload: dict = Body(...))`
- **Source:** `backend/routes/social_routes.py:82`
- **Summary:** Reverse image search to identify associated social profiles
- **Description:** -
- **Request models:** `dict`
- **Roles:** -
- **Licenses:** `scanning`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('scanning'))]`
- **Return expressions:** `await search_model.getInstance().social_search({'file_bytes': file_bytes, 'filename': 'upload.png'}, 'recon/image')`, `{'status': 'error', 'message': 'image_base64_required'}`

### `backend/routes/tenant_routes.py`

#### `POST /api/get/current/user/chat-history`

- **Handler:** `async get_current_user_chat_history(current_user = Depends(get_current_user))`
- **Source:** `backend/routes/tenant_routes.py:103`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST]))]`
- **Return expressions:** `await AccountManager.get_instance().get_current_user_chat_history(current_user)`

#### `POST /api/update/current/user/chat-history`

- **Handler:** `async update_current_user_chat_history(data: chat_history_model, current_user = Depends(get_current_user))`
- **Source:** `backend/routes/tenant_routes.py:111`
- **Summary:** -
- **Description:** -
- **Request models:** `chat_history_model`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST]))]`
- **Return expressions:** `await AccountManager.get_instance().update_current_user_chat_history(data, current_user)`

#### `DELETE /api/tenant/image`

- **Handler:** `async update_user(current_user = Depends(get_current_user))`
- **Source:** `backend/routes/tenant_routes.py:120`
- **Summary:** Update user
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.MEMBER]))]`
- **Return expressions:** `await ResourceManager.get_instance().deleteTenantImage(current_user)`

#### `PUT /api/tenant/image`

- **Handler:** `async upload_profile_image(file: UploadFile, current_user = Depends(get_current_user))`
- **Source:** `backend/routes/tenant_routes.py:128`
- **Summary:** Upload profile image
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.MEMBER]))]`
- **Return expressions:** `await ResourceManager.get_instance().uploadTenantImage(file, current_user)`

#### `PUT /api/system/image`

- **Handler:** `async upload_profile_image(file: UploadFile, current_user = Depends(get_current_user))`
- **Source:** `backend/routes/tenant_routes.py:135`
- **Summary:** Upload system image
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.MEMBER]))]`
- **Return expressions:** `await ResourceManager.get_instance().update_system_image(file, current_user)`

#### `DELETE /api/user/image`

- **Handler:** `async update_user(current_user = Depends(get_current_user))`
- **Source:** `backend/routes/tenant_routes.py:144`
- **Summary:** Update user
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST]))]`
- **Return expressions:** `await ResourceManager.get_instance().delete_user_image(current_user)`

#### `PUT /api/user/image`

- **Handler:** `async upload_profile_image(file: UploadFile, current_user = Depends(get_current_user))`
- **Source:** `backend/routes/tenant_routes.py:152`
- **Summary:** Upload profile image
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST]))]`
- **Return expressions:** `await ResourceManager.get_instance().update_user_image(file, current_user)`

#### `POST /api/delete/user`

- **Handler:** `async delete_user(user: user_param_model, current_user = Depends(get_current_user))`
- **Source:** `backend/routes/tenant_routes.py:160`
- **Summary:** -
- **Description:** -
- **Request models:** `user_param_model`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.MEMBER]))]`
- **Return expressions:** `await AccountManager.get_instance().delete_user(user, current_user)`

#### `POST /api/tenant/create/user`

- **Handler:** `async create_tenant_user(data: user_model, current_user = Depends(get_current_user))`
- **Source:** `backend/routes/tenant_routes.py:175`
- **Summary:** Create tenant user
- **Description:** Create a new company user in the current tenant.
- **Request models:** `user_model`
- **Roles:** -
- **Licenses:** `maintainer`
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.MEMBER, user_role.ADMIN])), Depends(license_required('maintainer'))]`
- **Return expressions:** `await TenantManager.get_instance().create_tenant_user(data, current_user)`

#### `POST /api/audit/logs`

- **Handler:** `async get_audit_logs(param: audit_log_param_model = Body(...), current_user = Depends(get_current_user))`
- **Source:** `backend/routes/tenant_routes.py:190`
- **Summary:** Get audit logs
- **Description:** Retrieve audit logs for the current tenant and user context.
- **Request models:** `audit_log_param_model`
- **Roles:** -
- **Licenses:** `maintainer`
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.DEMO])), Depends(license_required('maintainer'))]`
- **Return expressions:** `await AuditLogManager.get_instance().get(param, current_user)`

#### `DELETE /api/audit/{log_id}/delete`

- **Handler:** `async delete_audit_log(log_id: str, current_user = Depends(get_current_user))`
- **Source:** `backend/routes/tenant_routes.py:202`
- **Summary:** Delete audit log
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN]))]`
- **Return expressions:** `{'success': await AuditLogManager.get_instance().delete(log_id)}`

#### `GET /api/get/tenant/alert/summary`

- **Handler:** `async get_node(current_user = Depends(get_current_user))`
- **Source:** `backend/routes/tenant_routes.py:211`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(status_required([UserStatus.ACTIVE]))]`
- **Return expressions:** `await AlertManager.getInstance().get_alert_summary(str(current_user.tenant_uuid))`

#### `POST /api/get/tenant/node`

- **Handler:** `async get_node(current_user = Depends(get_current_user))`
- **Source:** `backend/routes/tenant_routes.py:219`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(status_required([UserStatus.ACTIVE]))]`
- **Return expressions:** `await AccountManager.get_instance().get_node(current_user)`

#### `POST /api/alert/add`

- **Handler:** `async add_custom_alert(data: AlertModel, current_user = Depends(get_current_user))`
- **Source:** `backend/routes/tenant_routes.py:233`
- **Summary:** Add custom alert
- **Description:** Create a new custom alert for the current user profile.
- **Request models:** `AlertModel`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.MEMBER])), Depends(status_required([UserStatus.ACTIVE]))]`
- **Return expressions:** `await AlertManager.getInstance().add_custom_alert(data, current_user)`

#### `POST /api/alert/seen`

- **Handler:** `async set_alerts_seen(data: list[AlertModel], current_user = Depends(get_current_user))`
- **Source:** `backend/routes/tenant_routes.py:247`
- **Summary:** Mark alerts as seen
- **Description:** Mark one or more alerts as seen for the current user profile.
- **Request models:** `list[AlertModel]`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.MEMBER])), Depends(status_required([UserStatus.ACTIVE]))]`
- **Return expressions:** `await AlertManager.getInstance().set_alert_seen(data, current_user)`

#### `POST /api/alert/delete`

- **Handler:** `async delete_alert(id: str = Body(..., description='Unique id identifier of the alert to delete.'), current_user = Depends(get_current_user))`
- **Source:** `backend/routes/tenant_routes.py:261`
- **Summary:** Delete alert
- **Description:** Delete a specific alert identified by its id for the current user.
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.MEMBER])), Depends(status_required([UserStatus.ACTIVE]))]`
- **Return expressions:** `await AlertManager.getInstance().delete_alert(id, current_user)`

#### `POST /api/alert/update`

- **Handler:** `async update_alert(data: AlertModel, current_user = Depends(get_current_user))`
- **Source:** `backend/routes/tenant_routes.py:276`
- **Summary:** Update alert
- **Description:** Update an existing alert for the current user profile.
- **Request models:** `AlertModel`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.MEMBER])), Depends(status_required([UserStatus.ACTIVE]))]`
- **Return expressions:** `await AlertManager.getInstance().update_alert(data, current_user)`

#### `GET /api/profile/alerts`

- **Handler:** `async get_user_alerts(current_user = Depends(get_current_user), page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=20), alert_type: str | None = Query(None), paginate: bool = Query(False), compact: bool = Query(False), unseen_only: bool = Query(False), include_counts: bool = Query(False))`
- **Source:** `backend/routes/tenant_routes.py:290`
- **Summary:** Get user alerts
- **Description:** Retrieve all alerts for the current user profile.
- **Request models:** `str | None`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.MEMBER])), Depends(status_required([UserStatus.ACTIVE]))]`
- **Return expressions:** `await AlertManager.getInstance().getAllAlerts(current_user, page=page, limit=limit, alert_type=alert_type, paginate=paginate, compact=compact, unseen_only=unseen_only, include_counts=include_counts)`

#### `POST /api/profile/alert/scan`

- **Handler:** `async run_user_ioc_alerts(current_user = Depends(get_current_user))`
- **Source:** `backend/routes/tenant_routes.py:318`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** `maintainer`
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.MEMBER])), Depends(status_required([UserStatus.ACTIVE])), Depends(license_required('maintainer'))]`
- **Return expressions:** `{'started': True}`

#### `POST /api/profile/alert/scan/cancel`

- **Handler:** `async cancel_user_ioc_alerts(current_user = Depends(get_current_user))`
- **Source:** `backend/routes/tenant_routes.py:340`
- **Summary:** Cancel IOC alert scan
- **Description:** Cancel alert scanning for all categories for the current user.
- **Request models:** -
- **Roles:** -
- **Licenses:** `maintainer`
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.MEMBER])), Depends(status_required([UserStatus.ACTIVE])), Depends(license_required('maintainer'))]`
- **Return expressions:** `await AlertManager.getInstance().set_scan_running(current_user.tenant_uuid, False, True)`

#### `POST /api/profile/alerts/delete/all`

- **Handler:** `async delete_all_alerts(current_user = Depends(get_current_user))`
- **Source:** `backend/routes/tenant_routes.py:349`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** `maintainer`
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.MEMBER])), Depends(status_required([UserStatus.ACTIVE])), Depends(license_required('maintainer'))]`
- **Return expressions:** `await AlertManager.getInstance().delete_all_alerts(current_user)`

#### `POST /api/profile/alerts/delete/{_type}`

- **Handler:** `async delete_typed_alerts(_type: str, current_user = Depends(get_current_user))`
- **Source:** `backend/routes/tenant_routes.py:357`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** `maintainer`
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.MEMBER])), Depends(status_required([UserStatus.ACTIVE])), Depends(license_required('maintainer'))]`
- **Return expressions:** `await AlertManager.getInstance().delete_alerts_by_type(current_user, _type)`

#### `POST /api/get/tenant`

- **Handler:** `async get_tenant(current_user = Depends(get_current_user))`
- **Source:** `backend/routes/tenant_routes.py:36`
- **Summary:** Get tenant for current user
- **Description:** Retrieve tenant information associated with the current authenticated user.
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.DEMO, user_role.ADMIN, user_role.MEMBER, user_role.ANALYST]))]`
- **Return expressions:** `await TenantManager.get_instance().get_tenant(current_user)`

#### `POST /api/profile/alert/scan/status`

- **Handler:** `async get_alert_scan_status(current_user = Depends(get_current_user))`
- **Source:** `backend/routes/tenant_routes.py:371`
- **Summary:** Get alert scan status
- **Description:** Get the status of the latest alert scan for the current user.
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.MEMBER])), Depends(status_required([UserStatus.ACTIVE]))]`
- **Return expressions:** `await AlertManager.getInstance().get_scan_status(current_user)`

#### `POST /api/update/tenants`

- **Handler:** `async update_tenant(data: TenantRequest, current_user = Depends(get_current_user))`
- **Source:** `backend/routes/tenant_routes.py:51`
- **Summary:** Update tenant
- **Description:** Update tenant configuration and metadata for the current user's tenant.
- **Request models:** `TenantRequest`
- **Roles:** -
- **Licenses:** `maintainer`
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.MEMBER, user_role.ADMIN])), Depends(status_required([UserStatus.ACTIVE])), Depends(license_required('maintainer'))]`
- **Return expressions:** `await TenantManager.get_instance().update_tenant(data, current_user)`

#### `POST /api/users`

- **Handler:** `async get_tenant_users(current_user = Depends(get_current_user))`
- **Source:** `backend/routes/tenant_routes.py:65`
- **Summary:** Get all users for tenant
- **Description:** Retrieve all users associated with the current user's tenant.
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.MEMBER, user_role.ADMIN]))]`
- **Return expressions:** `await AccountManager.get_instance().get_all_users(current_user)`

#### `POST /api/tenants/get`

- **Handler:** `async get_all_tenants()`
- **Source:** `backend/routes/tenant_routes.py:79`
- **Summary:** Get all tenants
- **Description:** Retrieve all tenant records available to the current user.
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN]))]`
- **Return expressions:** `await TenantManager.get_instance().get_all_tenant()`

#### `POST /api/update/user`

- **Handler:** `async update_user(user: tenant_param_model, current_user = Depends(get_current_user))`
- **Source:** `backend/routes/tenant_routes.py:87`
- **Summary:** -
- **Description:** -
- **Request models:** `tenant_param_model`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.MEMBER]))]`
- **Return expressions:** `await AccountManager.get_instance().update_user(user, current_user)`

#### `POST /api/update/current/user`

- **Handler:** `async update_user(user: user_meta_model, current_user = Depends(get_current_user))`
- **Source:** `backend/routes/tenant_routes.py:95`
- **Summary:** -
- **Description:** -
- **Request models:** `user_meta_model`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST]))]`
- **Return expressions:** `await AccountManager.get_instance().update_current_user(user, current_user)`

### `backend/routes/test_routes.py`

#### `POST /api/dynamic/user`

- **Handler:** `async test_search_dynamic_email(param: search_dynamic_param_model = Body(...))`
- **Source:** `backend/routes/test_routes.py:105`
- **Summary:** -
- **Description:** -
- **Request models:** `search_dynamic_param_model`
- **Roles:** -
- **Licenses:** `scanning`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('scanning'))]`
- **Return expressions:** `json.loads((_MOCKS_DIR / 'dynamic_user_done.json').read_text(encoding='utf-8'))`, `step`

#### `POST /api/dynamic/cracked`

- **Handler:** `async test_search_dynamic_cracked(param: search_dynamic_crack_model = Body(...))`
- **Source:** `backend/routes/test_routes.py:117`
- **Summary:** -
- **Description:** -
- **Request models:** `search_dynamic_crack_model`
- **Roles:** -
- **Licenses:** `scanning`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('scanning'))]`
- **Return expressions:** `json.loads((_MOCKS_DIR / 'dynamic_cracked.json').read_text(encoding='utf-8'))`, `step`

#### `POST /api/forgot`

- **Handler:** `async forgotPassword(request: ForgotPasswordRequest)`
- **Source:** `backend/routes/test_routes.py:125`
- **Summary:** -
- **Description:** -
- **Request models:** `ForgotPasswordRequest`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** -
- **Return expressions:** `await auth_manager.forgot_password(request.email)`

#### `POST /api/dynamic/software`

- **Handler:** `async test_search_dynamic_software(param: search_dynamic_crack_model = Body(...))`
- **Source:** `backend/routes/test_routes.py:134`
- **Summary:** -
- **Description:** -
- **Request models:** `search_dynamic_crack_model`
- **Roles:** -
- **Licenses:** `scanning`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('scanning'))]`
- **Return expressions:** `_pending_or_api_mock('dynamic_software', 'dynamic_software.json')`

#### `POST /api/urlscan/dns`

- **Handler:** `async test_search_dynamic_ip_scan(param: DomainScanRequest = Body(...))`
- **Source:** `backend/routes/test_routes.py:147`
- **Summary:** -
- **Description:** -
- **Request models:** `DomainScanRequest`
- **Roles:** -
- **Licenses:** `scanning`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('scanning'))]`
- **Return expressions:** `_pending_or_api_mock('urlscan_ip', 'urlscan_domain_iplookup.json')`

#### `POST /api/urlscan/ip`

- **Handler:** `async test_search_dynamic_ip_scan(param: DomainScanRequest = Body(...))`
- **Source:** `backend/routes/test_routes.py:147`
- **Summary:** -
- **Description:** -
- **Request models:** `DomainScanRequest`
- **Roles:** -
- **Licenses:** `scanning`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('scanning'))]`
- **Return expressions:** `_pending_or_api_mock('urlscan_ip', 'urlscan_domain_iplookup.json')`

#### `POST /api/dynamic/social`

- **Handler:** `async test_search_dynamic_social(param: search_dynamic_social_model = Body(...))`
- **Source:** `backend/routes/test_routes.py:155`
- **Summary:** -
- **Description:** -
- **Request models:** `search_dynamic_social_model`
- **Roles:** -
- **Licenses:** `scanning`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('scanning'))]`
- **Return expressions:** `json.loads((_MOCKS_DIR / 'dynamic_social.json').read_text(encoding='utf-8'))`, `step`

#### `POST /api/dynamic/wanted`

- **Handler:** `async test_search_dynamic_wanted(param: search_dynamic_social_model = Body(...))`
- **Source:** `backend/routes/test_routes.py:167`
- **Summary:** -
- **Description:** -
- **Request models:** `search_dynamic_social_model`
- **Roles:** -
- **Licenses:** `scanning`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('scanning'))]`
- **Return expressions:** `_pending_or_api_mock('dynamic_wanted', 'dynamic_wanted.json')`

#### `POST /api/dynamic/national-identity`

- **Handler:** `async test_search_dynamic_national_identity(param: search_dynamic_crack_model = Body(...))`
- **Source:** `backend/routes/test_routes.py:176`
- **Summary:** -
- **Description:** -
- **Request models:** `search_dynamic_crack_model`
- **Roles:** -
- **Licenses:** `scanning`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('scanning'))]`
- **Return expressions:** `_pending_or_api_mock('dynamic_national_identity', 'dynamic_national_identity.json')`

#### `POST /api/urlscan/domain`

- **Handler:** `async test_parse_domain(payload: DomainScanRequest)`
- **Source:** `backend/routes/test_routes.py:185`
- **Summary:** -
- **Description:** -
- **Request models:** `DomainScanRequest`
- **Roles:** -
- **Licenses:** `scanning`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(limiter_dependency), Depends(license_required('scanning'))]`
- **Return expressions:** `_pending_or_dynamic_scan(payload.scanType)`

#### `POST /api/urlscan/subdomains`

- **Handler:** `async test_parse_subdomains(payload: DomainScanRequest)`
- **Source:** `backend/routes/test_routes.py:194`
- **Summary:** -
- **Description:** -
- **Request models:** `DomainScanRequest`
- **Roles:** -
- **Licenses:** `scanning`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(limiter_dependency), Depends(license_required('scanning'))]`
- **Return expressions:** `_pending_or_dynamic_scan(payload.scanType)`

#### `POST /api/urlscan/wayback`

- **Handler:** `async test_parse_wayback(payload: DomainScanRequest)`
- **Source:** `backend/routes/test_routes.py:203`
- **Summary:** -
- **Description:** -
- **Request models:** `DomainScanRequest`
- **Roles:** -
- **Licenses:** `scanning`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(limiter_dependency), Depends(license_required('scanning'))]`
- **Return expressions:** `_pending_or_dynamic_scan(payload.scanType)`

#### `POST /api/ioc/extract`

- **Handler:** `async extract_ioc(file: UploadFile = File(...))`
- **Source:** `backend/routes/test_routes.py:212`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST]))]`
- **Return expressions:** `_pending_or_api_mock('ioc_file_extract', 'ioc_file_extract.json')`

#### `POST /file/scan/{user_id}`

- **Handler:** `async file_scan(user_id: str, file: UploadFile = File(...))`
- **Source:** `backend/routes/test_routes.py:219`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** -
- **Return expressions:** `_pending_or_api_mock('ioc_file_extract', 'ioc_file_extract.json')`

#### `POST /api/apk/scan`

- **Handler:** `async extract_ioc(file: UploadFile = File(...))`
- **Source:** `backend/routes/test_routes.py:229`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST]))]`
- **Return expressions:** `json.loads((_MOCKS_DIR / f'ioc_apk_extract.json').read_text(encoding='utf-8'))`, `step`

#### `POST /api/crypto/scan`

- **Handler:** `async extract_crypto()`
- **Source:** `backend/routes/test_routes.py:242`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST]))]`
- **Return expressions:** `json.loads((_MOCKS_DIR / f'dynamic_crypto_scan.json').read_text(encoding='utf-8'))`, `step`

#### `POST /api/nexus/analyze-text`

- **Handler:** `async test_nexus_analyze_text(_payload: dict = Body(...))`
- **Source:** `backend/routes/test_routes.py:256`
- **Summary:** -
- **Description:** -
- **Request models:** `dict`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST]))]`
- **Return expressions:** `_load_api_mock('nexus_analyze_text.json')`

#### `POST /api/cross/search`

- **Handler:** `async test_cross_search(payload: search_dynamic_onion_search = Body(...))`
- **Source:** `backend/routes/test_routes.py:268`
- **Summary:** -
- **Description:** -
- **Request models:** `search_dynamic_onion_search`
- **Roles:** -
- **Licenses:** `scanning`
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('scanning'))]`
- **Return expressions:** `_pending_or_api_mock('dynamic_cross_search', 'dynamic_cross_search.json')`

#### `POST /api/netintel/resolve_ip`

- **Handler:** `async test_netintel_resolve_ip(payload: ResolveIPRequest = Body(...))`
- **Source:** `backend/routes/test_routes.py:279`
- **Summary:** -
- **Description:** -
- **Request models:** `ResolveIPRequest`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST]))]`
- **Return expressions:** `json.loads((_MOCKS_DIR / 'netintel_resolve_ip.json').read_text(encoding='utf-8'))`, `step`

#### `POST /api/netintel/ipscanner`

- **Handler:** `async test_netintel_ipscanner(payload: NetIntelDeepScanRequest = Body(...))`
- **Source:** `backend/routes/test_routes.py:293`
- **Summary:** -
- **Description:** -
- **Request models:** `NetIntelDeepScanRequest`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST]))]`
- **Return expressions:** `json.loads((_MOCKS_DIR / 'netintel_ipscanner.json').read_text(encoding='utf-8'))`, `step`

#### `POST /api/netintel/url_vulnerability_scan`

- **Handler:** `async test_netintel_url_vulnerability_scan(payload: UrlVulnerabilityScanRequest = Body(...))`
- **Source:** `backend/routes/test_routes.py:307`
- **Summary:** -
- **Description:** -
- **Request models:** `UrlVulnerabilityScanRequest`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST]))]`
- **Return expressions:** `_pending_or_dynamic_scan('basic')`

#### `POST /api/netintel/iot_detect`

- **Handler:** `async test_netintel_camera_detect(payload: GeoCameraDetectRequest = Body(...))`
- **Source:** `backend/routes/test_routes.py:318`
- **Summary:** -
- **Description:** -
- **Request models:** `GeoCameraDetectRequest`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST]))]`
- **Return expressions:** `json.loads((_MOCKS_DIR / 'netintel_camera_detect.json').read_text(encoding='utf-8'))`, `step`

#### `POST /api/netintel/camera_detect_ranges`

- **Handler:** `async test_netintel_camera_detect_ranges(payload: GeoCameraDetectRangesRequest = Body(...))`
- **Source:** `backend/routes/test_routes.py:332`
- **Summary:** -
- **Description:** -
- **Request models:** `GeoCameraDetectRangesRequest`
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST]))]`
- **Return expressions:** `json.loads((_MOCKS_DIR / 'netintel_camera_detect_ranges.json').read_text(encoding='utf-8'))`, `step`

#### `POST /api/social/recon`

- **Handler:** `async test_social_recon(payload: dict = Body(...))`
- **Source:** `backend/routes/test_routes.py:344`
- **Summary:** -
- **Description:** -
- **Request models:** `dict`
- **Roles:** -
- **Licenses:** `scanning`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('scanning'))]`
- **Return expressions:** `_pending_or_elastic_mock('social_recon', 'social_recon.json')`

#### `POST /api/social/recon/image`

- **Handler:** `async test_social_recon_image(payload: dict = Body(...))`
- **Source:** `backend/routes/test_routes.py:353`
- **Summary:** -
- **Description:** -
- **Request models:** `dict`
- **Roles:** -
- **Licenses:** `scanning`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('scanning'))]`
- **Return expressions:** `_pending_or_elastic_mock('social_recon_image', 'social_recon_image.json')`

#### `POST /api/social/profile`

- **Handler:** `async test_social_profile(payload: dict = Body(...))`
- **Source:** `backend/routes/test_routes.py:362`
- **Summary:** -
- **Description:** -
- **Request models:** `dict`
- **Roles:** -
- **Licenses:** `scanning`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('scanning'))]`
- **Return expressions:** `_pending_or_elastic_mock('social_profile', 'social_profile.json')`

#### `POST /api/social/online/images`

- **Handler:** `async test_social_online_images(payload: dict = Body(...))`
- **Source:** `backend/routes/test_routes.py:371`
- **Summary:** -
- **Description:** -
- **Request models:** `dict`
- **Roles:** -
- **Licenses:** `scanning`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('scanning'))]`
- **Return expressions:** `_pending_or_elastic_mock('social_online_images', 'social_online_images.json')`

#### `POST /api/social/posts`

- **Handler:** `async test_social_posts(payload: dict = Body(...))`
- **Source:** `backend/routes/test_routes.py:380`
- **Summary:** -
- **Description:** -
- **Request models:** `dict`
- **Roles:** -
- **Licenses:** `scanning`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('scanning'))]`
- **Return expressions:** `_pending_or_elastic_mock('social_posts', 'social_posts.json')`

#### `POST /api/social/followers`

- **Handler:** `async test_social_followers(payload: dict = Body(...))`
- **Source:** `backend/routes/test_routes.py:389`
- **Summary:** -
- **Description:** -
- **Request models:** `dict`
- **Roles:** -
- **Licenses:** `scanning`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('scanning'))]`
- **Return expressions:** `_pending_or_elastic_mock('social_followers', 'social_followers.json')`

#### `POST /api/social/following`

- **Handler:** `async test_social_following(payload: dict = Body(...))`
- **Source:** `backend/routes/test_routes.py:398`
- **Summary:** -
- **Description:** -
- **Request models:** `dict`
- **Roles:** -
- **Licenses:** `scanning`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('scanning'))]`
- **Return expressions:** `_pending_or_elastic_mock('social_following', 'social_following.json')`

#### `POST /api/social/entity`

- **Handler:** `async test_social_entity(payload: dict = Body(...))`
- **Source:** `backend/routes/test_routes.py:407`
- **Summary:** -
- **Description:** -
- **Request models:** `dict`
- **Roles:** -
- **Licenses:** `scanning`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('scanning'))]`
- **Return expressions:** `_pending_or_elastic_mock('social_entity', 'social_entity.json')`

#### `POST /api/social/session/upsert`

- **Handler:** `async test_social_session_upsert(data: dict = Body(...), graph_type: str = Query('social'))`
- **Source:** `backend/routes/test_routes.py:416`
- **Summary:** -
- **Description:** -
- **Request models:** `dict`
- **Roles:** -
- **Licenses:** `scanning`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('scanning'))]`
- **Return expressions:** `_pending_or_elastic_mock(f'social_session_upsert_{graph_type}', 'social_session_upsert.json')`

#### `GET /api/social/session/tabs`

- **Handler:** `async test_social_session_tabs(graph_type: str = Query('social'))`
- **Source:** `backend/routes/test_routes.py:425`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** `scanning`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('scanning'))]`
- **Return expressions:** `_load_elastic_mock('social_session_tabs_social.json')`, `_load_elastic_mock('social_session_tabs_graph.json')`

#### `POST /api/social/session/tab/add`

- **Handler:** `async test_social_session_tab_add(tab: dict = Body(...), graph_type: str = Query('social'))`
- **Source:** `backend/routes/test_routes.py:436`
- **Summary:** -
- **Description:** -
- **Request models:** `dict`
- **Roles:** -
- **Licenses:** `scanning`
- **Settings:** -
- **Include in schema:** `default`
- **Dependencies:** `[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required('scanning'))]`
- **Return expressions:** `_pending_or_elastic_mock(f'social_session_tab_add_{graph_type}', 'social_session_tab_add.json')`

#### `POST /api/get/tenant/node`

- **Handler:** `async test_get_tenant_node(current_user = Depends(get_current_user))`
- **Source:** `backend/routes/test_routes.py:90`
- **Summary:** -
- **Description:** -
- **Request models:** -
- **Roles:** -
- **Licenses:** -
- **Settings:** -
- **Include in schema:** `False`
- **Dependencies:** -
- **Return expressions:** `response`

