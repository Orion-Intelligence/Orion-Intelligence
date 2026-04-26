(source-file-inventory)=

# Source File Inventory

This inventory is generated from maintainable source roots. It intentionally excludes dependency folders, build output, caches, and generated bundles. Static binary assets are summarized by nearby source references rather than expanded as implementation files.

Inventory file count: **801**.

## Counts By Kind

| Kind | Count |
| --- | ---: |
| angular component | 140 |
| angular template | 139 |
| typescript | 84 |
| backend manager/service | 76 |
| backend model | 74 |
| documentation | 63 |
| angular service/resolver/guard | 60 |
| backend python | 47 |
| typescript model | 47 |
| stylesheet | 15 |
| backend test | 14 |
| text | 11 |
| backend route module | 10 |
| json data/config | 6 |
| angular directive | 5 |
| angular pipe | 5 |
| configuration | 3 |
| angular routes | 1 |
| script | 1 |

## Files

### `README.md`

#### `README.md`

- **Kind:** documentation
- **Size:** 21858 bytes, 194 lines
- **Summary:** Documentation page: Orion Platform.
- **Details:** -

### `backend`

#### `backend/configs/app_dependency.py`

- **Kind:** backend python
- **Size:** 4482 bytes, 123 lines
- **Summary:** Defines functions get_current_role, get_current_status, role_required, get_current_user, get_is_free_token; API routes /api/token.
- **Details:** functions: get_current_role, get_current_status, role_required, get_current_user, get_is_free_token, status_required, license_required, get_user_permissions; api: /api/token

#### `backend/configs/config.py`

- **Kind:** backend python
- **Size:** 1238 bytes, 25 lines
- **Summary:** Python source module.
- **Details:** -

#### `backend/configs/exception_handlers.py`

- **Kind:** backend python
- **Size:** 2394 bytes, 53 lines
- **Summary:** Defines functions clean_traceback, global_exception_handler, validation_exception_handler, password_size_exception_handler, value_error_exception_handler.
- **Details:** functions: clean_traceback, global_exception_handler, validation_exception_handler, password_size_exception_handler, value_error_exception_handler, form_validation_exception_handler

#### `backend/configs/limiter_dependency.py`

- **Kind:** backend python
- **Size:** 540 bytes, 23 lines
- **Summary:** Defines functions limiter_dependency.
- **Details:** functions: limiter_dependency

#### `backend/configs/swagger_config.py`

- **Kind:** backend python
- **Size:** 757 bytes, 21 lines
- **Summary:** Defines functions configure_swagger; API routes /api/token.
- **Details:** functions: configure_swagger; api: /api/token

#### `backend/configs/token_auth_provider.py`

- **Kind:** backend python
- **Size:** 4234 bytes, 97 lines
- **Summary:** Defines classes TokenAuthProvider; functions setup_admin; API routes /admin, /admin/, /admin/login.
- **Details:** classes: TokenAuthProvider; functions: setup_admin; api: /admin, /admin/, /admin/login

#### `backend/migrations/migration.py`

- **Kind:** backend python
- **Size:** 2202 bytes, 55 lines
- **Summary:** Defines classes migration_manager.
- **Details:** classes: migration_manager

#### `backend/migrations/migration_runner.py`

- **Kind:** backend python
- **Size:** 2758 bytes, 58 lines
- **Summary:** Defines functions run_migration, get_stored_version.
- **Details:** functions: run_migration, get_stored_version

#### `backend/migrations/scripts/__init__.py`

- **Kind:** backend python
- **Size:** 0 bytes, 0 lines
- **Summary:** File is larger than the analyzer read limit; inventory includes metadata only.
- **Details:** -

#### `backend/migrations/scripts/migration_1_0_3_1.py`

- **Kind:** backend python
- **Size:** 1670 bytes, 38 lines
- **Summary:** Defines classes migration_1_0_3_1.
- **Details:** classes: migration_1_0_3_1

### `backend/orion`

#### `backend/orion/__init__.py`

- **Kind:** backend python
- **Size:** 0 bytes, 0 lines
- **Summary:** File is larger than the analyzer read limit; inventory includes metadata only.
- **Details:** -

#### `backend/orion/api/__init__.py`

- **Kind:** backend python
- **Size:** 0 bytes, 0 lines
- **Summary:** File is larger than the analyzer read limit; inventory includes metadata only.
- **Details:** -

#### `backend/orion/api/admin/db_public_admin.py`

- **Kind:** backend python
- **Size:** 333 bytes, 8 lines
- **Summary:** Defines classes SystemSettingsView.
- **Details:** classes: SystemSettingsView

#### `backend/orion/api/interactive/__init__.py`

- **Kind:** backend python
- **Size:** 0 bytes, 0 lines
- **Summary:** File is larger than the analyzer read limit; inventory includes metadata only.
- **Details:** -

#### `backend/orion/api/interactive/account_manager/__init__.py`

- **Kind:** backend manager/service
- **Size:** 0 bytes, 0 lines
- **Summary:** File is larger than the analyzer read limit; inventory includes metadata only.
- **Details:** -

#### `backend/orion/api/interactive/account_manager/account_manager.py`

- **Kind:** backend manager/service
- **Size:** 17397 bytes, 344 lines
- **Summary:** Defines classes AccountManager; API routes /api/s/static/tenant/, /api/s/static/user/.
- **Details:** classes: AccountManager; api: /api/s/static/tenant/, /api/s/static/user/

#### `backend/orion/api/interactive/account_manager/models/__init__.py`

- **Kind:** backend model
- **Size:** 0 bytes, 0 lines
- **Summary:** File is larger than the analyzer read limit; inventory includes metadata only.
- **Details:** -

#### `backend/orion/api/interactive/account_manager/models/chat_history_model.py`

- **Kind:** backend model
- **Size:** 307 bytes, 13 lines
- **Summary:** Defines classes ChatHistoryMessageModel, chat_history_model.
- **Details:** classes: ChatHistoryMessageModel, chat_history_model

#### `backend/orion/api/interactive/account_manager/models/node_callback_model.py`

- **Kind:** backend model
- **Size:** 1463 bytes, 52 lines
- **Summary:** Defines classes UserDataModel, TenantDataModel, NodeCallbackModel.
- **Details:** classes: UserDataModel, TenantDataModel, NodeCallbackModel

#### `backend/orion/api/interactive/account_manager/models/user_meta_model.py`

- **Kind:** backend model
- **Size:** 319 bytes, 12 lines
- **Summary:** Defines classes user_meta_model.
- **Details:** classes: user_meta_model

#### `backend/orion/api/interactive/account_manager/models/user_model.py`

- **Kind:** backend model
- **Size:** 341 bytes, 15 lines
- **Summary:** Defines classes user_model.
- **Details:** classes: user_model

#### `backend/orion/api/interactive/account_manager/models/user_param_model.py`

- **Kind:** backend model
- **Size:** 571 bytes, 21 lines
- **Summary:** Defines classes UserStatus, user_param_model.
- **Details:** classes: UserStatus, user_param_model

#### `backend/orion/api/interactive/alert_manager/alert_manager.py`

- **Kind:** backend manager/service
- **Size:** 19973 bytes, 503 lines
- **Summary:** Defines classes AlertManager.
- **Details:** classes: AlertManager

#### `backend/orion/api/interactive/alert_manager/alert_summary_helper.py`

- **Kind:** backend manager/service
- **Size:** 3456 bytes, 91 lines
- **Summary:** Defines classes AlertSummaryHelper.
- **Details:** classes: AlertSummaryHelper

#### `backend/orion/api/interactive/alert_manager/function_map/function_maping.py`

- **Kind:** backend manager/service
- **Size:** 569 bytes, 6 lines
- **Summary:** Python source module.
- **Details:** -

#### `backend/orion/api/interactive/auditlog_manager/audit_log_manager.py`

- **Kind:** backend manager/service
- **Size:** 5311 bytes, 132 lines
- **Summary:** Defines classes AuditLogManager.
- **Details:** classes: AuditLogManager

#### `backend/orion/api/interactive/auditlog_manager/models/audit_log_param_model.py`

- **Kind:** backend model
- **Size:** 211 bytes, 9 lines
- **Summary:** Defines classes audit_log_param_model.
- **Details:** classes: audit_log_param_model

#### `backend/orion/api/interactive/auth_manager/auth_manager.py`

- **Kind:** backend manager/service
- **Size:** 9909 bytes, 206 lines
- **Summary:** Defines classes auth_manager.
- **Details:** classes: auth_manager

#### `backend/orion/api/interactive/auth_manager/models/forgot_password_request.py`

- **Kind:** backend model
- **Size:** 155 bytes, 10 lines
- **Summary:** Defines classes ForgotPasswordRequest, ResetPassword.
- **Details:** classes: ForgotPasswordRequest, ResetPassword

#### `backend/orion/api/interactive/directory_manager/directory_model.py`

- **Kind:** backend model
- **Size:** 2622 bytes, 71 lines
- **Summary:** Defines classes directory_model.
- **Details:** classes: directory_model

#### `backend/orion/api/interactive/directory_manager/directory_shared_model/directory_callback_model.py`

- **Kind:** backend model
- **Size:** 758 bytes, 26 lines
- **Summary:** Defines classes directory_callback_link, directory_callback_model.
- **Details:** classes: directory_callback_link, directory_callback_model

#### `backend/orion/api/interactive/directory_manager/directory_shared_model/directory_param_model.py`

- **Kind:** backend model
- **Size:** 806 bytes, 23 lines
- **Summary:** Defines classes directory_param_model.
- **Details:** classes: directory_param_model

#### `backend/orion/api/interactive/dump_manager/dump_model.py`

- **Kind:** backend model
- **Size:** 2336 bytes, 56 lines
- **Summary:** Defines classes dump_model.
- **Details:** classes: dump_model

#### `backend/orion/api/interactive/dump_manager/dump_shared_model/dump_callback_model.py`

- **Kind:** backend model
- **Size:** 623 bytes, 25 lines
- **Summary:** Defines classes dump_callback_link, dump_callback_model.
- **Details:** classes: dump_callback_link, dump_callback_model

#### `backend/orion/api/interactive/dump_manager/dump_shared_model/dump_param_model.py`

- **Kind:** backend model
- **Size:** 432 bytes, 17 lines
- **Summary:** Defines classes dump_param_model.
- **Details:** classes: dump_param_model

#### `backend/orion/api/interactive/feedback_manager/feedback_manager.py`

- **Kind:** backend manager/service
- **Size:** 15829 bytes, 357 lines
- **Summary:** Defines classes FeedbackManager.
- **Details:** classes: FeedbackManager

#### `backend/orion/api/interactive/feedback_manager/models/feedback_param_model.py`

- **Kind:** backend model
- **Size:** 154 bytes, 9 lines
- **Summary:** Defines classes feedback_param_model, feedback_comment_param_model.
- **Details:** classes: feedback_param_model, feedback_comment_param_model

#### `backend/orion/api/interactive/feeder_manager/feeder_helper.py`

- **Kind:** backend manager/service
- **Size:** 17665 bytes, 397 lines
- **Summary:** Defines classes FeederHelper.
- **Details:** classes: FeederHelper

#### `backend/orion/api/interactive/feeder_manager/feeder_manager.py`

- **Kind:** backend manager/service
- **Size:** 17658 bytes, 391 lines
- **Summary:** Defines classes FeederManager.
- **Details:** classes: FeederManager

#### `backend/orion/api/interactive/feeder_manager/models/feeder_models.py`

- **Kind:** backend model
- **Size:** 2425 bytes, 95 lines
- **Summary:** Defines classes FeederRuleOption, FeederCatalogResponse, FeederValueItem, FeederScriptItem.
- **Details:** classes: FeederRuleOption, FeederCatalogResponse, FeederValueItem, FeederScriptItem, FeederScriptListResponse, FeederUploadResponse

#### `backend/orion/api/interactive/graph_manager/graph_models/search_social_callback_model.py`

- **Kind:** backend model
- **Size:** 894 bytes, 33 lines
- **Summary:** Defines classes suggestion, result_item, search_social_callback_model.
- **Details:** classes: suggestion, result_item, search_social_callback_model

#### `backend/orion/api/interactive/graph_manager/graph_models/search_social_param_model.py`

- **Kind:** backend model
- **Size:** 2397 bytes, 75 lines
- **Summary:** Defines classes search_social_param_model, SocialReconRequest, SearchEngineMetaRequest, PlatformUsernameRequest.
- **Details:** classes: search_social_param_model, SocialReconRequest, SearchEngineMetaRequest, PlatformUsernameRequest, SocialProfileRequest, SocialPostRequest

#### `backend/orion/api/interactive/graph_manager/graphs_model.py`

- **Kind:** backend model
- **Size:** 7663 bytes, 207 lines
- **Summary:** Defines classes graphs_model.
- **Details:** classes: graphs_model

#### `backend/orion/api/interactive/hompage_manager/__init__.py`

- **Kind:** backend manager/service
- **Size:** 0 bytes, 0 lines
- **Summary:** File is larger than the analyzer read limit; inventory includes metadata only.
- **Details:** -

#### `backend/orion/api/interactive/hompage_manager/homepage_model.py`

- **Kind:** backend model
- **Size:** 12163 bytes, 280 lines
- **Summary:** Defines classes homepage_model.
- **Details:** classes: homepage_model

#### `backend/orion/api/interactive/payment_manager/model/payment_param_model.py`

- **Kind:** backend model
- **Size:** 190 bytes, 10 lines
- **Summary:** Defines classes PaymentParamModel.
- **Details:** classes: PaymentParamModel

#### `backend/orion/api/interactive/payment_manager/payment_manager.py`

- **Kind:** backend manager/service
- **Size:** 1775 bytes, 43 lines
- **Summary:** Defines classes PaymentManager.
- **Details:** classes: PaymentManager

#### `backend/orion/api/interactive/resource_manager/resource_manager.py`

- **Kind:** backend manager/service
- **Size:** 5130 bytes, 137 lines
- **Summary:** Defines classes ResourceManager.
- **Details:** classes: ResourceManager

#### `backend/orion/api/interactive/search_manager/__init__.py`

- **Kind:** backend manager/service
- **Size:** 0 bytes, 0 lines
- **Summary:** File is larger than the analyzer read limit; inventory includes metadata only.
- **Details:** -

#### `backend/orion/api/interactive/search_manager/search_callback_model.py`

- **Kind:** backend model
- **Size:** 6514 bytes, 153 lines
- **Summary:** Defines classes search_callback.
- **Details:** classes: search_callback

#### `backend/orion/api/interactive/search_manager/search_data_model/__init__.py`

- **Kind:** backend manager/service
- **Size:** 0 bytes, 0 lines
- **Summary:** File is larger than the analyzer read limit; inventory includes metadata only.
- **Details:** -

#### `backend/orion/api/interactive/search_manager/search_data_model/chat/search_chat_callback_model.py`

- **Kind:** backend model
- **Size:** 455 bytes, 15 lines
- **Summary:** Defines classes search_chat_callback_model.
- **Details:** classes: search_chat_callback_model

#### `backend/orion/api/interactive/search_manager/search_data_model/chat/search_chat_param_model.py`

- **Kind:** backend model
- **Size:** 401 bytes, 14 lines
- **Summary:** Defines classes search_chat_param_model.
- **Details:** classes: search_chat_param_model

#### `backend/orion/api/interactive/search_manager/search_data_model/consolidated/search_consolidated_callback_model.py`

- **Kind:** backend model
- **Size:** 1629 bytes, 24 lines
- **Summary:** Defines classes grouped_consolidated_search_callback_model.
- **Details:** classes: grouped_consolidated_search_callback_model

#### `backend/orion/api/interactive/search_manager/search_data_model/consolidated/search_consolidated_param_model.py`

- **Kind:** backend model
- **Size:** 1354 bytes, 40 lines
- **Summary:** Defines classes search_consolidated_param_model.
- **Details:** classes: search_consolidated_param_model

#### `backend/orion/api/interactive/search_manager/search_data_model/defacement/search_defacement_callback_model.py`

- **Kind:** backend model
- **Size:** 971 bytes, 28 lines
- **Summary:** Defines classes result_item, search_defacement_callback_model.
- **Details:** classes: result_item, search_defacement_callback_model

#### `backend/orion/api/interactive/search_manager/search_data_model/defacement/search_defacement_param_model.py`

- **Kind:** backend model
- **Size:** 825 bytes, 22 lines
- **Summary:** Defines classes search_defacement_param_model.
- **Details:** classes: search_defacement_param_model

#### `backend/orion/api/interactive/search_manager/search_data_model/dump/search_credential_param_model.py`

- **Kind:** backend model
- **Size:** 911 bytes, 26 lines
- **Summary:** Defines classes PasswordFilterModel, search_credential_param_model.
- **Details:** classes: PasswordFilterModel, search_credential_param_model

#### `backend/orion/api/interactive/search_manager/search_data_model/dump/search_stealerlog_callback_model.py`

- **Kind:** backend model
- **Size:** 671 bytes, 28 lines
- **Summary:** Defines classes suggestion, stealerlog_result_item, search_stealerlog_callback_model.
- **Details:** classes: suggestion, stealerlog_result_item, search_stealerlog_callback_model

#### `backend/orion/api/interactive/search_manager/search_data_model/dynamic/__init__.py`

- **Kind:** backend manager/service
- **Size:** 0 bytes, 0 lines
- **Summary:** File is larger than the analyzer read limit; inventory includes metadata only.
- **Details:** -

#### `backend/orion/api/interactive/search_manager/search_data_model/dynamic/search_dynamic_param_model.py`

- **Kind:** backend model
- **Size:** 1057 bytes, 35 lines
- **Summary:** Defines classes search_dynamic_param_model, search_dynamic_crack_model, search_dynamic_social_model, search_dynamic_onion_search.
- **Details:** classes: search_dynamic_param_model, search_dynamic_crack_model, search_dynamic_social_model, search_dynamic_onion_search, search_dynamic_crypto_model

#### `backend/orion/api/interactive/search_manager/search_data_model/enums.py`

- **Kind:** backend manager/service
- **Size:** 151 bytes, 8 lines
- **Summary:** Python source module.
- **Details:** -

#### `backend/orion/api/interactive/search_manager/search_data_model/exploit/search_exploit_callback_model.py`

- **Kind:** backend model
- **Size:** 963 bytes, 29 lines
- **Summary:** Defines classes result_item, search_exploit_callback_model.
- **Details:** classes: result_item, search_exploit_callback_model

#### `backend/orion/api/interactive/search_manager/search_data_model/exploit/search_exploit_param_model.py`

- **Kind:** backend model
- **Size:** 676 bytes, 18 lines
- **Summary:** Defines classes search_exploit_param_model.
- **Details:** classes: search_exploit_param_model

#### `backend/orion/api/interactive/search_manager/search_data_model/general/__init__.py`

- **Kind:** backend manager/service
- **Size:** 0 bytes, 0 lines
- **Summary:** File is larger than the analyzer read limit; inventory includes metadata only.
- **Details:** -

#### `backend/orion/api/interactive/search_manager/search_data_model/general/search_general_callback_model.py`

- **Kind:** backend model
- **Size:** 1524 bytes, 42 lines
- **Summary:** Defines classes result_item, search_general_callback_model.
- **Details:** classes: result_item, search_general_callback_model

#### `backend/orion/api/interactive/search_manager/search_data_model/general/search_general_param_model.py`

- **Kind:** backend model
- **Size:** 779 bytes, 22 lines
- **Summary:** Defines classes search_general_param_model.
- **Details:** classes: search_general_param_model

#### `backend/orion/api/interactive/search_manager/search_data_model/leak/__init__.py`

- **Kind:** backend manager/service
- **Size:** 0 bytes, 0 lines
- **Summary:** File is larger than the analyzer read limit; inventory includes metadata only.
- **Details:** -

#### `backend/orion/api/interactive/search_manager/search_data_model/leak/search_leak_callback_model.py`

- **Kind:** backend model
- **Size:** 1669 bytes, 46 lines
- **Summary:** Defines classes result_item, search_leak_callback_model.
- **Details:** classes: result_item, search_leak_callback_model

#### `backend/orion/api/interactive/search_manager/search_data_model/leak/search_leak_param_model.py`

- **Kind:** backend model
- **Size:** 1066 bytes, 37 lines
- **Summary:** Defines classes _search_base_param_model, search_leak_param_model, search_news_param_model, search_news_internal_param_model.
- **Details:** classes: _search_base_param_model, search_leak_param_model, search_news_param_model, search_news_internal_param_model

#### `backend/orion/api/interactive/search_manager/search_data_model/search_callback_model.py`

- **Kind:** backend model
- **Size:** 1273 bytes, 47 lines
- **Summary:** Defines classes suggestion, result_item, search_callback_model.
- **Details:** classes: suggestion, result_item, search_callback_model

#### `backend/orion/api/interactive/search_manager/search_enums.py`

- **Kind:** backend manager/service
- **Size:** 1339 bytes, 52 lines
- **Summary:** Python source module.
- **Details:** -

#### `backend/orion/api/interactive/search_manager/search_model.py`

- **Kind:** backend model
- **Size:** 18084 bytes, 413 lines
- **Summary:** Defines classes search_model.
- **Details:** classes: search_model

#### `backend/orion/api/interactive/siemlog_manager/siem_log_manager.py`

- **Kind:** backend manager/service
- **Size:** 7134 bytes, 183 lines
- **Summary:** Defines classes SiemLogManager.
- **Details:** classes: SiemLogManager

#### `backend/orion/api/interactive/signup_manager/model/__init__.py`

- **Kind:** backend manager/service
- **Size:** 0 bytes, 0 lines
- **Summary:** File is larger than the analyzer read limit; inventory includes metadata only.
- **Details:** -

#### `backend/orion/api/interactive/signup_manager/model/signup_request_model.py`

- **Kind:** backend model
- **Size:** 256 bytes, 14 lines
- **Summary:** Defines classes SignupRequest, SupportRequest.
- **Details:** classes: SignupRequest, SupportRequest

#### `backend/orion/api/interactive/signup_manager/signup_manager.py`

- **Kind:** backend manager/service
- **Size:** 7255 bytes, 165 lines
- **Summary:** Defines classes SignupManager.
- **Details:** classes: SignupManager

#### `backend/orion/api/interactive/tenant_manager/models/tenant_param_model.py`

- **Kind:** backend model
- **Size:** 600 bytes, 22 lines
- **Summary:** Defines classes UserStatus, tenant_param_model.
- **Details:** classes: UserStatus, tenant_param_model

#### `backend/orion/api/interactive/tenant_manager/tenant_bootstrap.py`

- **Kind:** backend manager/service
- **Size:** 2737 bytes, 75 lines
- **Summary:** Defines functions create_default_tenant, create_default_users, tenant_boostrap.
- **Details:** functions: create_default_tenant, create_default_users, tenant_boostrap

#### `backend/orion/api/interactive/tenant_manager/tenant_manager.py`

- **Kind:** backend manager/service
- **Size:** 18884 bytes, 384 lines
- **Summary:** Defines classes TenantManager.
- **Details:** classes: TenantManager

#### `backend/orion/api/server/__init__.py`

- **Kind:** backend python
- **Size:** 0 bytes, 0 lines
- **Summary:** File is larger than the analyzer read limit; inventory includes metadata only.
- **Details:** -

#### `backend/orion/api/server/config_manager/config_controller.py`

- **Kind:** backend manager/service
- **Size:** 7434 bytes, 183 lines
- **Summary:** Defines classes config_controller; API routes /api/s/static/system/, /api/s/static/system/logo_url_default.png, /api/s/static/system/logo_wide_dark_default.png.
- **Details:** classes: config_controller; api: /api/s/static/system/, /api/s/static/system/logo_url_default.png, /api/s/static/system/logo_wide_dark_default.png, /api/s/static/system/logo_wide_light_default.png, /api/s/static/system/{base}_custom.png, /api/s/static/system/{base}_default.png

#### `backend/orion/api/server/config_manager/model/config_data.py`

- **Kind:** backend manager/service
- **Size:** 117 bytes, 7 lines
- **Summary:** Defines classes config_data.
- **Details:** classes: config_data

#### `backend/orion/api/server/crawl_manager/__init__.py`

- **Kind:** backend manager/service
- **Size:** 0 bytes, 0 lines
- **Summary:** File is larger than the analyzer read limit; inventory includes metadata only.
- **Details:** -

#### `backend/orion/api/server/crawl_manager/class_model/CTITextRequest.py`

- **Kind:** backend manager/service
- **Size:** 80 bytes, 5 lines
- **Summary:** Defines classes CTITextRequest.
- **Details:** classes: CTITextRequest

#### `backend/orion/api/server/crawl_manager/class_model/__init__.py`

- **Kind:** backend manager/service
- **Size:** 1480 bytes, 41 lines
- **Summary:** Python source module.
- **Details:** -

#### `backend/orion/api/server/crawl_manager/class_model/chat_model.py`

- **Kind:** backend model
- **Size:** 1514 bytes, 43 lines
- **Summary:** Defines classes chat_model, chat_data_model.
- **Details:** classes: chat_model, chat_data_model

#### `backend/orion/api/server/crawl_manager/class_model/credential_model.py`

- **Kind:** backend model
- **Size:** 470 bytes, 18 lines
- **Summary:** Defines classes credential_model, credential_data_model.
- **Details:** classes: credential_model, credential_data_model

#### `backend/orion/api/server/crawl_manager/class_model/defacement_model.py`

- **Kind:** backend model
- **Size:** 905 bytes, 27 lines
- **Summary:** Defines classes CardExtractionModel, DefacementDataModel.
- **Details:** classes: CardExtractionModel, DefacementDataModel

#### `backend/orion/api/server/crawl_manager/class_model/domain_scan_request_model.py`

- **Kind:** backend model
- **Size:** 491 bytes, 18 lines
- **Summary:** Defines classes DomainScanRequest, UrlVulnerabilityScanRequest.
- **Details:** classes: DomainScanRequest, UrlVulnerabilityScanRequest

#### `backend/orion/api/server/crawl_manager/class_model/dump_model.py`

- **Kind:** backend model
- **Size:** 212 bytes, 12 lines
- **Summary:** Defines classes DumpModel.
- **Details:** classes: DumpModel

#### `backend/orion/api/server/crawl_manager/class_model/entity_model.py`

- **Kind:** backend model
- **Size:** 102 bytes, 5 lines
- **Summary:** Defines classes entity_model.
- **Details:** classes: entity_model

#### `backend/orion/api/server/crawl_manager/class_model/exploit_model.py`

- **Kind:** backend model
- **Size:** 878 bytes, 28 lines
- **Summary:** Defines classes CardExtractionModel, ExploitDataModel.
- **Details:** classes: CardExtractionModel, ExploitDataModel

#### `backend/orion/api/server/crawl_manager/class_model/file_model.py`

- **Kind:** backend model
- **Size:** 101 bytes, 6 lines
- **Summary:** Defines classes ScreenshotPayload.
- **Details:** classes: ScreenshotPayload

#### `backend/orion/api/server/crawl_manager/class_model/general_model.py`

- **Kind:** backend model
- **Size:** 599 bytes, 25 lines
- **Summary:** Defines classes GeneralDataModel.
- **Details:** classes: GeneralDataModel

#### `backend/orion/api/server/crawl_manager/class_model/ip_scan_request_model.py`

- **Kind:** backend model
- **Size:** 970 bytes, 40 lines
- **Summary:** Defines classes IPScanRequest, NetIntelDeepScanRequest, ResolveIPRequest, GeoCameraDetectRequest.
- **Details:** classes: IPScanRequest, NetIntelDeepScanRequest, ResolveIPRequest, GeoCameraDetectRequest, GeoCameraDetectRangesRequest

#### `backend/orion/api/server/crawl_manager/class_model/leak_model.py`

- **Kind:** backend model
- **Size:** 2094 bytes, 50 lines
- **Summary:** Defines classes CardExtractionModel, LeakDataModel.
- **Details:** classes: CardExtractionModel, LeakDataModel

#### `backend/orion/api/server/crawl_manager/class_model/log_model.py`

- **Kind:** backend model
- **Size:** 6187 bytes, 138 lines
- **Summary:** Defines classes LogModel, LogBatchModel, InjectionLogModel, InjectionBatchRequestModel.
- **Details:** classes: LogModel, LogBatchModel, InjectionLogModel, InjectionBatchRequestModel, InjectionBatchResponseModel, SiemSearchRequestModel

#### `backend/orion/api/server/crawl_manager/class_model/nlp_data_model.py`

- **Kind:** backend model
- **Size:** 111 bytes, 7 lines
- **Summary:** Defines classes nlp_data_model.
- **Details:** classes: nlp_data_model

#### `backend/orion/api/server/crawl_manager/class_model/open_sanctions_model.py`

- **Kind:** backend model
- **Size:** 342 bytes, 14 lines
- **Summary:** Defines classes open_sanctions_data_model.
- **Details:** classes: open_sanctions_data_model

#### `backend/orion/api/server/crawl_manager/class_model/report_chat_data_model.py`

- **Kind:** backend model
- **Size:** 207 bytes, 12 lines
- **Summary:** Defines classes ReportChatRequest, NexusTextAnalysisRequest.
- **Details:** classes: ReportChatRequest, NexusTextAnalysisRequest

#### `backend/orion/api/server/crawl_manager/class_model/social_model.py`

- **Kind:** backend model
- **Size:** 980 bytes, 32 lines
- **Summary:** Defines classes social_model, social_data_model.
- **Details:** classes: social_model, social_data_model

#### `backend/orion/api/server/crawl_manager/class_model/social_scrape_request_model.py`

- **Kind:** backend model
- **Size:** 728 bytes, 29 lines
- **Summary:** Defines classes SocialTarget, SocialScrapeRequest.
- **Details:** classes: SocialTarget, SocialScrapeRequest

#### `backend/orion/api/server/crawl_manager/crawl_enums.py`

- **Kind:** backend manager/service
- **Size:** 280 bytes, 8 lines
- **Summary:** Defines classes CRAWL_CALLBACK_RESPONSES, CRAWL_PATHS.
- **Details:** classes: CRAWL_CALLBACK_RESPONSES, CRAWL_PATHS

#### `backend/orion/api/server/crawl_manager/crawl_model.py`

- **Kind:** backend model
- **Size:** 27166 bytes, 621 lines
- **Summary:** Defines classes crawl_model.
- **Details:** classes: crawl_model

#### `backend/orion/api/server/entity_manager/entity_manager.py`

- **Kind:** backend manager/service
- **Size:** 7985 bytes, 165 lines
- **Summary:** Defines classes entity_manager.
- **Details:** classes: entity_manager

#### `backend/orion/api/server/entity_manager/entity_request_generator.py`

- **Kind:** backend manager/service
- **Size:** 12265 bytes, 348 lines
- **Summary:** Defines classes EntityRequestGenerator.
- **Details:** classes: EntityRequestGenerator

#### `backend/orion/api/server/entity_manager/modal/EntityQueryModel.py`

- **Kind:** backend manager/service
- **Size:** 171 bytes, 9 lines
- **Summary:** Defines classes EntityQueryModel.
- **Details:** classes: EntityQueryModel

#### `backend/orion/constants/__init__.py`

- **Kind:** backend python
- **Size:** 0 bytes, 0 lines
- **Summary:** File is larger than the analyzer read limit; inventory includes metadata only.
- **Details:** -

#### `backend/orion/constants/constant.py`

- **Kind:** backend python
- **Size:** 1424 bytes, 37 lines
- **Summary:** Defines classes CONSTANTS.
- **Details:** classes: CONSTANTS

#### `backend/orion/helper_manager/__init__.py`

- **Kind:** backend manager/service
- **Size:** 0 bytes, 0 lines
- **Summary:** File is larger than the analyzer read limit; inventory includes metadata only.
- **Details:** -

#### `backend/orion/helper_manager/env_handler.py`

- **Kind:** backend manager/service
- **Size:** 685 bytes, 28 lines
- **Summary:** Defines classes env_handler.
- **Details:** classes: env_handler

#### `backend/orion/helper_manager/helper_controller.py`

- **Kind:** backend manager/service
- **Size:** 12428 bytes, 338 lines
- **Summary:** Defines classes helper_controller.
- **Details:** classes: helper_controller

#### `backend/orion/management/__init__.py`

- **Kind:** backend python
- **Size:** 0 bytes, 0 lines
- **Summary:** File is larger than the analyzer read limit; inventory includes metadata only.
- **Details:** -

#### `backend/orion/management/jobs/alert_job.py`

- **Kind:** backend python
- **Size:** 27207 bytes, 532 lines
- **Summary:** Defines classes alert_job.
- **Details:** classes: alert_job

#### `backend/orion/management/jobs/insight_job.py`

- **Kind:** backend python
- **Size:** 6653 bytes, 142 lines
- **Summary:** Defines classes insight_job.
- **Details:** classes: insight_job

#### `backend/orion/management/managers/__init__.py`

- **Kind:** backend manager/service
- **Size:** 0 bytes, 0 lines
- **Summary:** File is larger than the analyzer read limit; inventory includes metadata only.
- **Details:** -

#### `backend/orion/management/managers/cronjob_manager.py`

- **Kind:** backend manager/service
- **Size:** 2313 bytes, 72 lines
- **Summary:** Defines classes cronjob_manager.
- **Details:** classes: cronjob_manager

#### `backend/orion/management/managers/service_manager.py`

- **Kind:** backend manager/service
- **Size:** 2853 bytes, 74 lines
- **Summary:** Defines classes service_manager.
- **Details:** classes: service_manager

#### `backend/orion/management/managers/test_manager.py`

- **Kind:** backend test
- **Size:** 14300 bytes, 365 lines
- **Summary:** Defines classes test_manager.
- **Details:** classes: test_manager

#### `backend/orion/management/models/insight_model.py`

- **Kind:** backend model
- **Size:** 2364 bytes, 49 lines
- **Summary:** Defines classes GenericModel, LeakModel, DefacementModel, InsightData.
- **Details:** classes: GenericModel, LeakModel, DefacementModel, InsightData

#### `backend/orion/management/models/insight_model_comparison.py`

- **Kind:** backend model
- **Size:** 2593 bytes, 49 lines
- **Summary:** Defines classes MetricComparison, GenericModelComparison, LeakModelComparison, DefacementModelComparison.
- **Details:** classes: MetricComparison, GenericModelComparison, LeakModelComparison, DefacementModelComparison, InsightComparisonModel

#### `backend/orion/middleware/__init__.py`

- **Kind:** backend python
- **Size:** 0 bytes, 0 lines
- **Summary:** File is larger than the analyzer read limit; inventory includes metadata only.
- **Details:** -

#### `backend/orion/middleware/middleware_setup.py`

- **Kind:** backend python
- **Size:** 1901 bytes, 45 lines
- **Summary:** Defines classes EnforceHTTPSMiddleware; functions setup_middlewares.
- **Details:** classes: EnforceHTTPSMiddleware; functions: setup_middlewares

#### `backend/orion/middleware/middlewares/__init__.py`

- **Kind:** backend python
- **Size:** 0 bytes, 0 lines
- **Summary:** File is larger than the analyzer read limit; inventory includes metadata only.
- **Details:** -

#### `backend/orion/middleware/middlewares/cache_admin.py`

- **Kind:** backend python
- **Size:** 497 bytes, 13 lines
- **Summary:** Defines classes cache_admin; API routes /admin, /admin/.
- **Details:** classes: cache_admin; api: /admin, /admin/

#### `backend/orion/middleware/middlewares/content_block_middleware.py`

- **Kind:** backend python
- **Size:** 1260 bytes, 39 lines
- **Summary:** Defines classes content_block_middleware; API routes /api/.
- **Details:** classes: content_block_middleware; api: /api/

#### `backend/orion/middleware/middlewares/content_security_policy_middleware.py`

- **Kind:** backend python
- **Size:** 7477 bytes, 111 lines
- **Summary:** Defines classes content_security_policy_middleware; API routes /admin.
- **Details:** classes: content_security_policy_middleware; api: /admin

#### `backend/orion/middleware/middlewares/security_headers_middleware.py`

- **Kind:** backend python
- **Size:** 939 bytes, 22 lines
- **Summary:** Defines classes security_headers_middleware.
- **Details:** classes: security_headers_middleware

#### `backend/orion/middleware/middlewares/service_ready_middleware.py`

- **Kind:** backend python
- **Size:** 723 bytes, 21 lines
- **Summary:** Defines classes service_ready_middleware.
- **Details:** classes: service_ready_middleware

#### `backend/orion/services/__init__.py`

- **Kind:** backend python
- **Size:** 35 bytes, 2 lines
- **Summary:** Defines functions env_manager.
- **Details:** functions: env_manager

#### `backend/orion/services/arango_manager/arango_controller.py`

- **Kind:** backend manager/service
- **Size:** 3465 bytes, 101 lines
- **Summary:** Defines classes arango_controller.
- **Details:** classes: arango_controller

#### `backend/orion/services/arango_manager/arango_enums.py`

- **Kind:** backend manager/service
- **Size:** 320 bytes, 8 lines
- **Summary:** Defines classes ARANGO_CONNECTIONS.
- **Details:** classes: ARANGO_CONNECTIONS

#### `backend/orion/services/elastic_manager/__init__.py`

- **Kind:** backend manager/service
- **Size:** 0 bytes, 0 lines
- **Summary:** File is larger than the analyzer read limit; inventory includes metadata only.
- **Details:** -

#### `backend/orion/services/elastic_manager/elastic_controller.py`

- **Kind:** backend manager/service
- **Size:** 20077 bytes, 422 lines
- **Summary:** Defines classes elastic_controller.
- **Details:** classes: elastic_controller

#### `backend/orion/services/elastic_manager/elastic_enums.py`

- **Kind:** backend manager/service
- **Size:** 17970 bytes, 251 lines
- **Summary:** Defines classes ELASTIC_SEMANTIC_INDEX, ELASTIC_INDEX, ELASTIC_SEMANTIC, ELASTIC_CONNECTIONS.
- **Details:** classes: ELASTIC_SEMANTIC_INDEX, ELASTIC_INDEX, ELASTIC_SEMANTIC, ELASTIC_CONNECTIONS, ELASTIC_KEYS, MANAGE_ELASTIC_MESSAGES

#### `backend/orion/services/elastic_manager/elastic_insight_generator.py`

- **Kind:** backend manager/service
- **Size:** 4158 bytes, 125 lines
- **Summary:** Defines classes elastic_insight_generator.
- **Details:** classes: elastic_insight_generator

#### `backend/orion/services/elastic_manager/elastic_request_generator.py`

- **Kind:** backend manager/service
- **Size:** 51602 bytes, 1173 lines
- **Summary:** Defines classes elastic_request_generator.
- **Details:** classes: elastic_request_generator

#### `backend/orion/services/elastic_manager/elastic_semantic_controller.py`

- **Kind:** backend manager/service
- **Size:** 6386 bytes, 150 lines
- **Summary:** Defines classes elastic_semantic_controller.
- **Details:** classes: elastic_semantic_controller

#### `backend/orion/services/encryption_manager/encryption_manager.py`

- **Kind:** backend manager/service
- **Size:** 599 bytes, 18 lines
- **Summary:** Defines classes encryption_manager.
- **Details:** classes: encryption_manager

#### `backend/orion/services/encryption_manager/key_manager.py`

- **Kind:** backend manager/service
- **Size:** 2245 bytes, 61 lines
- **Summary:** Defines classes KeyManager.
- **Details:** classes: KeyManager

#### `backend/orion/services/log_manager/log_controller.py`

- **Kind:** backend manager/service
- **Size:** 6259 bytes, 172 lines
- **Summary:** Defines classes log.
- **Details:** classes: log

#### `backend/orion/services/mail_manager/__init__.py`

- **Kind:** backend manager/service
- **Size:** 0 bytes, 0 lines
- **Summary:** File is larger than the analyzer read limit; inventory includes metadata only.
- **Details:** -

#### `backend/orion/services/mail_manager/mail_enums.py`

- **Kind:** backend manager/service
- **Size:** 819 bytes, 23 lines
- **Summary:** Defines classes MailSubject, MailMessage, MailUrlHeading.
- **Details:** classes: MailSubject, MailMessage, MailUrlHeading

#### `backend/orion/services/mail_manager/mail_manager.py`

- **Kind:** backend manager/service
- **Size:** 3675 bytes, 75 lines
- **Summary:** Defines classes mail_manager.
- **Details:** classes: mail_manager

#### `backend/orion/services/mongo_manager/__init__.py`

- **Kind:** backend manager/service
- **Size:** 906 bytes, 10 lines
- **Summary:** Python source module.
- **Details:** -

#### `backend/orion/services/mongo_manager/mongo_controller.py`

- **Kind:** backend manager/service
- **Size:** 5908 bytes, 128 lines
- **Summary:** Defines classes mongo_controller.
- **Details:** classes: mongo_controller

#### `backend/orion/services/mongo_manager/mongo_enums.py`

- **Kind:** backend manager/service
- **Size:** 346 bytes, 9 lines
- **Summary:** Defines classes MONGO_CONNECTIONS.
- **Details:** classes: MONGO_CONNECTIONS

#### `backend/orion/services/mongo_manager/shared_model/__init__.py`

- **Kind:** backend model
- **Size:** 0 bytes, 0 lines
- **Summary:** File is larger than the analyzer read limit; inventory includes metadata only.
- **Details:** -

#### `backend/orion/services/mongo_manager/shared_model/db_alert_model.py`

- **Kind:** backend model
- **Size:** 1457 bytes, 52 lines
- **Summary:** Defines classes alert_status, alert_all_ioc, AlertModel, db_alert_model.
- **Details:** classes: alert_status, alert_all_ioc, AlertModel, db_alert_model

#### `backend/orion/services/mongo_manager/shared_model/db_audit_log.py`

- **Kind:** backend model
- **Size:** 233 bytes, 10 lines
- **Summary:** Defines classes db_audit_log.
- **Details:** classes: db_audit_log

#### `backend/orion/services/mongo_manager/shared_model/db_auth_models.py`

- **Kind:** backend model
- **Size:** 5465 bytes, 152 lines
- **Summary:** Defines classes user_role, UserStatus, LicenseName, db_user_account; functions hash_password.
- **Details:** classes: user_role, UserStatus, LicenseName, db_user_account; functions: hash_password

#### `backend/orion/services/mongo_manager/shared_model/db_document_feedback_model.py`

- **Kind:** backend model
- **Size:** 1310 bytes, 39 lines
- **Summary:** Defines classes FeedbackTrustState, DocumentFeedbackComment, DocumentFeedbackReaction, db_document_feedback_model.
- **Details:** classes: FeedbackTrustState, DocumentFeedbackComment, DocumentFeedbackReaction, db_document_feedback_model

#### `backend/orion/services/mongo_manager/shared_model/db_dump_model.py`

- **Kind:** backend model
- **Size:** 324 bytes, 13 lines
- **Summary:** Defines classes db_dump_record_model.
- **Details:** classes: db_dump_record_model

#### `backend/orion/services/mongo_manager/shared_model/db_feeder_script_model.py`

- **Kind:** backend model
- **Size:** 725 bytes, 23 lines
- **Summary:** Defines classes osint_feeder, db_feeder_script_model.
- **Details:** classes: osint_feeder, db_feeder_script_model

#### `backend/orion/services/mongo_manager/shared_model/db_graph_sessions_model.py`

- **Kind:** backend model
- **Size:** 617 bytes, 21 lines
- **Summary:** Defines classes db_graph_sessions_model.
- **Details:** classes: db_graph_sessions_model

#### `backend/orion/services/mongo_manager/shared_model/db_keys.py`

- **Kind:** backend model
- **Size:** 258 bytes, 11 lines
- **Summary:** Defines classes db_keys.
- **Details:** classes: db_keys

#### `backend/orion/services/mongo_manager/shared_model/db_system_settings.py`

- **Kind:** backend model
- **Size:** 2865 bytes, 63 lines
- **Summary:** Defines classes AllowedKeys, db_system_model; functions _is_valid_meta_info.
- **Details:** classes: AllowedKeys, db_system_model; functions: _is_valid_meta_info

#### `backend/orion/services/mongo_manager/shared_model/db_tenant_model.py`

- **Kind:** backend model
- **Size:** 1411 bytes, 54 lines
- **Summary:** Defines classes IocCategory, TenantStatus, db_tenant_model, TenantRequest.
- **Details:** classes: IocCategory, TenantStatus, db_tenant_model, TenantRequest

#### `backend/orion/services/mongo_manager/shared_model/db_url_data_model.py`

- **Kind:** backend model
- **Size:** 443 bytes, 14 lines
- **Summary:** Defines classes db_url_data_model.
- **Details:** classes: db_url_data_model

#### `backend/orion/services/mongo_manager/shared_views/tenant_admin_view.py`

- **Kind:** backend manager/service
- **Size:** 2874 bytes, 66 lines
- **Summary:** Defines classes TenantAdminView.
- **Details:** classes: TenantAdminView

#### `backend/orion/services/mongo_manager/shared_views/tenant_key_admin_view.py`

- **Kind:** backend manager/service
- **Size:** 887 bytes, 25 lines
- **Summary:** Defines classes TenantKeyAdminView.
- **Details:** classes: TenantKeyAdminView

#### `backend/orion/services/mongo_manager/shared_views/user_admin_view.py`

- **Kind:** backend manager/service
- **Size:** 2167 bytes, 45 lines
- **Summary:** Defines classes UserAdminView.
- **Details:** classes: UserAdminView

#### `backend/orion/services/redis_manager/__init__.py`

- **Kind:** backend manager/service
- **Size:** 0 bytes, 0 lines
- **Summary:** File is larger than the analyzer read limit; inventory includes metadata only.
- **Details:** -

#### `backend/orion/services/redis_manager/redis_controller.py`

- **Kind:** backend manager/service
- **Size:** 5495 bytes, 138 lines
- **Summary:** Defines classes redis_controller.
- **Details:** classes: redis_controller

#### `backend/orion/services/redis_manager/redis_enums.py`

- **Kind:** backend manager/service
- **Size:** 836 bytes, 34 lines
- **Summary:** Defines classes REDIS_CONNECTIONS, REDIS_KEYS, REDIS_COMMANDS.
- **Details:** classes: REDIS_CONNECTIONS, REDIS_KEYS, REDIS_COMMANDS

#### `backend/orion/services/session_manager/__init__.py`

- **Kind:** backend manager/service
- **Size:** 0 bytes, 0 lines
- **Summary:** File is larger than the analyzer read limit; inventory includes metadata only.
- **Details:** -

#### `backend/orion/services/session_manager/session_enums.py`

- **Kind:** backend manager/service
- **Size:** 525 bytes, 11 lines
- **Summary:** Python source module.
- **Details:** -

#### `backend/orion/services/session_manager/session_manager.py`

- **Kind:** backend manager/service
- **Size:** 13731 bytes, 306 lines
- **Summary:** Defines classes session_manager.
- **Details:** classes: session_manager

#### `backend/orion/services/stix_manager/__init__.py`

- **Kind:** backend manager/service
- **Size:** 0 bytes, 0 lines
- **Summary:** File is larger than the analyzer read limit; inventory includes metadata only.
- **Details:** -

#### `backend/orion/services/stix_manager/converters/__init__.py`

- **Kind:** backend manager/service
- **Size:** 0 bytes, 0 lines
- **Summary:** File is larger than the analyzer read limit; inventory includes metadata only.
- **Details:** -

#### `backend/orion/services/stix_manager/converters/chat_converter.py`

- **Kind:** backend manager/service
- **Size:** 405 bytes, 11 lines
- **Summary:** Defines classes chat_converter.
- **Details:** classes: chat_converter

#### `backend/orion/services/stix_manager/converters/defacement_converter.py`

- **Kind:** backend manager/service
- **Size:** 441 bytes, 11 lines
- **Summary:** Defines classes defacement_converter.
- **Details:** classes: defacement_converter

#### `backend/orion/services/stix_manager/converters/exploit_converter.py`

- **Kind:** backend manager/service
- **Size:** 423 bytes, 11 lines
- **Summary:** Defines classes exploit_converter.
- **Details:** classes: exploit_converter

#### `backend/orion/services/stix_manager/converters/general_converter.py`

- **Kind:** backend manager/service
- **Size:** 423 bytes, 11 lines
- **Summary:** Defines classes general_converter.
- **Details:** classes: general_converter

#### `backend/orion/services/stix_manager/converters/leak_converter.py`

- **Kind:** backend manager/service
- **Size:** 405 bytes, 11 lines
- **Summary:** Defines classes leak_converter.
- **Details:** classes: leak_converter

#### `backend/orion/services/stix_manager/converters/social_converter.py`

- **Kind:** backend manager/service
- **Size:** 404 bytes, 11 lines
- **Summary:** Defines classes social_converter.
- **Details:** classes: social_converter

#### `backend/orion/services/stix_manager/converters/stix_minimal.py`

- **Kind:** backend manager/service
- **Size:** 15940 bytes, 437 lines
- **Summary:** Defines functions _as_list, _get, _first, _clean, _stix_id.
- **Details:** functions: _as_list, _get, _first, _clean, _stix_id, _parse_ts, _now_ts, _extract_iocs

#### `backend/orion/services/stix_manager/stix_manager.py`

- **Kind:** backend manager/service
- **Size:** 4975 bytes, 106 lines
- **Summary:** Defines classes _stix_spec, stix_manager.
- **Details:** classes: _stix_spec, stix_manager

#### `backend/orion/shared_models/__init__.py`

- **Kind:** backend python
- **Size:** 0 bytes, 0 lines
- **Summary:** File is larger than the analyzer read limit; inventory includes metadata only.
- **Details:** -

#### `backend/orion/shared_models/expection_handlers/expection_handlers_models.py`

- **Kind:** backend model
- **Size:** 368 bytes, 21 lines
- **Summary:** Defines classes TracebackModel, ErrorResponseModel, ValidationErrorDetail, ValidationErrorResponseModel.
- **Details:** classes: TracebackModel, ErrorResponseModel, ValidationErrorDetail, ValidationErrorResponseModel

### `backend/routes`

#### `backend/routes/admin_routes.py`

- **Kind:** backend route module
- **Size:** 2579 bytes, 56 lines
- **Summary:** Defines functions block_row_action, custom_edit_api, custom_edit_api_trailing, update_public_config, update_user; API routes /admin/api/db_system_model/row-action, /admin/api/db_user_account/edit/{id}, /admin/api/db_user_account/edit/{id}/.
- **Details:** functions: block_row_action, custom_edit_api, custom_edit_api_trailing, update_public_config, update_user, upload_system_image; api: /admin/api/db_system_model/row-action, /admin/api/db_user_account/edit/{id}, /admin/api/db_user_account/edit/{id}/, /admin/db_user_account/list, /api/public/update, /api/system/image

#### `backend/routes/api_micros.py`

- **Kind:** backend route module
- **Size:** 4392 bytes, 82 lines
- **Summary:** Defines functions ai_endpoint_required, fetch_cti_label, parse_ai, summarize_ai, chat_report; API routes /api/cti/fetch, /api/nexus/analyze-text, /api/nexus/chat.
- **Details:** functions: ai_endpoint_required, fetch_cti_label, parse_ai, summarize_ai, chat_report, nexus_chat, nexus_analyze_text; api: /api/cti/fetch, /api/nexus/analyze-text, /api/nexus/chat, /api/nlp/chat/report, /api/nlp/parse/ai, /api/nlp/summarize/ai

#### `backend/routes/api_routes.py`

- **Kind:** backend route module
- **Size:** 47684 bytes, 958 lines
- **Summary:** Defines functions _scan_domain_with_type, _enforce_demo_safe_search, index_injection, search_siem_logs, search_general; API routes /api/apk/scan, /api/cross/search, /api/crypto/scan.
- **Details:** functions: _scan_domain_with_type, _enforce_demo_safe_search, index_injection, search_siem_logs, search_general, search_leak, search_social, search_exploit; api: /api/apk/scan, /api/cross/search, /api/crypto/scan, /api/directory, /api/dumps, /api/dynamic/cracked

#### `backend/routes/auth_routes.py`

- **Kind:** backend route module
- **Size:** 4634 bytes, 123 lines
- **Summary:** Defines functions set_access_cookie, token_from_request, token, token_demo, verify_2fa; API routes /api/forgot, /api/logout, /api/signup.
- **Details:** functions: set_access_cookie, token_from_request, token, token_demo, verify_2fa, refresh_token, logout, signup; api: /api/forgot, /api/logout, /api/signup, /api/signup/verificaion, /api/subscription/request, /api/support

#### `backend/routes/crawl_routes.py`

- **Kind:** backend route module
- **Size:** 11022 bytes, 265 lines
- **Summary:** Defines functions feeder, parser, get_feeder_catalog, get_feeder_scripts, get_feeder_owner_users; API routes /api/feeder/status, /api/feeder/{index_type}, /api/index/chat.
- **Details:** functions: feeder, parser, get_feeder_catalog, get_feeder_scripts, get_feeder_owner_users, clear_feeder_scripts, enable_feeder_scripts, disable_feeder_scripts; api: /api/feeder/status, /api/feeder/{index_type}, /api/index/chat, /api/index/defacement, /api/index/dump, /api/index/entity

#### `backend/routes/docs/docs.py`

- **Kind:** backend route module
- **Size:** 179642 bytes, 2401 lines
- **Summary:** Defines functions _resolve_docs_dir, _read_md, _doc.
- **Details:** functions: _resolve_docs_dir, _read_md, _doc

#### `backend/routes/public_api_routes.py`

- **Kind:** backend route module
- **Size:** 2349 bytes, 57 lines
- **Summary:** Defines functions cookie_required, get_public_config, get_tenant_resource, get_user_resource, get_system_resource; API routes /api/public, /api/s/static/favicon, /api/s/static/system/{id}.
- **Details:** functions: cookie_required, get_public_config, get_tenant_resource, get_user_resource, get_system_resource, get_system_resource, robots_txt, search_stealerlog; api: /api/public, /api/s/static/favicon, /api/s/static/system/{id}, /api/s/static/tenant/{id}, /api/s/static/user/{id}, /api/search/stealerlogs

#### `backend/routes/social_routes.py`

- **Kind:** backend route module
- **Size:** 8824 bytes, 178 lines
- **Summary:** Defines functions search_dynamic_email, search_dynamic_phone_recon, search_dynamic_profile, search_dynamic_online_images, search_dynamic_image; API routes /api/social/entity, /api/social/followers, /api/social/following.
- **Details:** functions: search_dynamic_email, search_dynamic_phone_recon, search_dynamic_profile, search_dynamic_online_images, search_dynamic_image, search_dynamic_followers, search_dynamic_following, search_dynamic_posts; api: /api/social/entity, /api/social/followers, /api/social/following, /api/social/metadata, /api/social/online/images, /api/social/phone/recon

#### `backend/routes/tenant_routes.py`

- **Kind:** backend route module
- **Size:** 16127 bytes, 372 lines
- **Summary:** Defines functions get_tenant, update_tenant, get_tenant_users, get_all_tenants, update_user; API routes /api/alert/add, /api/alert/delete, /api/alert/seen.
- **Details:** functions: get_tenant, update_tenant, get_tenant_users, get_all_tenants, update_user, update_user, get_current_user_chat_history, update_current_user_chat_history; api: /api/alert/add, /api/alert/delete, /api/alert/seen, /api/alert/update, /api/audit/logs, /api/audit/{log_id}/delete

#### `backend/routes/test_routes.py`

- **Kind:** backend route module
- **Size:** 16437 bytes, 437 lines
- **Summary:** Defines functions _mock_step, _load_elastic_mock, _load_api_mock, _pending_or_api_mock, _pending_or_elastic_mock; API routes /api/apk/scan, /api/cross/search, /api/crypto/scan.
- **Details:** functions: _mock_step, _load_elastic_mock, _load_api_mock, _pending_or_api_mock, _pending_or_elastic_mock, _pending_or_dynamic_scan, require_testing_enabled, test_get_tenant_node; api: /api/apk/scan, /api/cross/search, /api/crypto/scan, /api/dynamic/cracked, /api/dynamic/national-identity, /api/dynamic/social

### `backend/tests`

#### `backend/tests/auth/test_account_manager.py`

- **Kind:** backend test
- **Size:** 16022 bytes, 402 lines
- **Summary:** Defines functions _run, _make_manager, _make_user, _make_tenant, test_get_all_users_returns_tenant_users_for_maintainer.
- **Details:** functions: _run, _make_manager, _make_user, _make_tenant, test_get_all_users_returns_tenant_users_for_maintainer, test_create_tenant_user_accepts_prehashed_bcrypt_password, test_create_tenant_user_rejects_duplicate_username_or_email, test_create_tenant_user_rejects_overlong_password

#### `backend/tests/auth/test_session_manager.py`

- **Kind:** backend test
- **Size:** 11078 bytes, 330 lines
- **Summary:** Defines functions _run, _make_user, _make_manager, _token, test_get_current_user_restores_missing_redis_session_from_token_sid.
- **Details:** functions: _run, _make_user, _make_manager, _token, test_get_current_user_restores_missing_redis_session_from_token_sid, test_get_current_user_rejects_invalid_token, test_get_current_user_rejects_missing_token, test_get_current_user_allows_crawler_without_session_checks

#### `backend/tests/fake_model/__init__.py`

- **Kind:** backend test
- **Size:** 1 bytes, 1 lines
- **Summary:** Python source module.
- **Details:** -

#### `backend/tests/fake_model/fakes.py`

- **Kind:** backend test
- **Size:** 6919 bytes, 228 lines
- **Summary:** Defines classes FakeDoc, FakeAuditManager, FakeMongoEngine, FakeElastic.
- **Details:** classes: FakeDoc, FakeAuditManager, FakeMongoEngine, FakeElastic, FakeRedis, FakeResponse

#### `backend/tests/pages/test_homepage_model.py`

- **Kind:** backend test
- **Size:** 7606 bytes, 178 lines
- **Summary:** Defines functions _run, test_invoke_analytics_reads_valid_comparison_from_redis, test_invoke_analytics_returns_none_for_missing_or_invalid_json, test_insight_consolidated_result_uses_cache_before_elastic, test_insight_consolidated_result_builds_and_caches_display_data.
- **Details:** functions: _run, test_invoke_analytics_reads_valid_comparison_from_redis, test_invoke_analytics_returns_none_for_missing_or_invalid_json, test_insight_consolidated_result_uses_cache_before_elastic, test_insight_consolidated_result_builds_and_caches_display_data, test_country_specific_insights_and_pagination_resolve_hashes, test_homepage_country_and_display_helpers_cover_edge_cases

#### `backend/tests/pages/test_siem_log_manager.py`

- **Kind:** backend test
- **Size:** 2679 bytes, 68 lines
- **Summary:** Defines functions _run, test_siem_manager_can_inject_and_search_same_logs.
- **Details:** functions: _run, test_siem_manager_can_inject_and_search_same_logs

#### `backend/tests/search/test_search_model.py`

- **Kind:** backend test
- **Size:** 12012 bytes, 336 lines
- **Summary:** Defines functions _run, _hit, _search_response, fake_elastic, test_search_wanted_list_builds_query_and_returns_cards.
- **Details:** functions: _run, _hit, _search_response, fake_elastic, test_search_wanted_list_builds_query_and_returns_cards, test_request_general_doc_fetches_document_and_translates_selected_fields, test_search_consolidated_ranked_result_uses_real_generator_and_passes_built_query, test_search_consolidated_iocs_builds_ioc_logic_and_returns_ranked_results

#### `backend/tests/service/test_crawl_model_service.py`

- **Kind:** backend test
- **Size:** 24595 bytes, 616 lines
- **Summary:** Defines classes _RoutingEngine; functions _run, _request, _json_request, test_swarm_url_helpers_and_proxy_resolution, test_update_or_create_model_updates_existing_and_creates_new_records.
- **Details:** classes: _RoutingEngine; functions: _run, _request, _json_request, test_swarm_url_helpers_and_proxy_resolution, test_update_or_create_model_updates_existing_and_creates_new_records, test_http_wrappers_post_expected_payloads_and_handle_errors, test_scan_wrappers_cover_success_non_200_and_exception, test_index_wrappers_cover_generator_and_elastic_paths

#### `backend/tests/service/test_elastic_request_generator_service.py`

- **Kind:** backend test
- **Size:** 5880 bytes, 133 lines
- **Summary:** Defines functions test_build_es_from_tagged_and_ioc_filters_cover_domain_and_match_none, test_query_block_supports_match_all_and_semantic_knn, test_date_filters_and_bulk_lookup_include_expected_ranges, test_consolidated_and_stealer_queries_build_clean_outputs, test_index_queries_and_summary_queries_return_entries.
- **Details:** functions: test_build_es_from_tagged_and_ioc_filters_cover_domain_and_match_none, test_query_block_supports_match_all_and_semantic_knn, test_date_filters_and_bulk_lookup_include_expected_ranges, test_consolidated_and_stealer_queries_build_clean_outputs, test_index_queries_and_summary_queries_return_entries

#### `backend/tests/service/test_helper_controller_service.py`

- **Kind:** backend test
- **Size:** 4637 bytes, 98 lines
- **Summary:** Defines functions test_parse_filters_json_returns_mapping_and_invalid_input, test_extract_stealer_hash_handles_credential_and_general_logs, test_filter_clause_hash_and_url_helpers_cover_core_paths, test_generate_data_hash_and_clone_model_behave_predictably, test_email_validation_query_helpers_and_password_schema.
- **Details:** functions: test_parse_filters_json_returns_mapping_and_invalid_input, test_extract_stealer_hash_handles_credential_and_general_logs, test_filter_clause_hash_and_url_helpers_cover_core_paths, test_generate_data_hash_and_clone_model_behave_predictably, test_email_validation_query_helpers_and_password_schema, test_build_assets_loads_templates_and_keys

#### `backend/tests/service/test_insight_job_service.py`

- **Kind:** backend test
- **Size:** 4098 bytes, 116 lines
- **Summary:** Defines functions _run, test_populate_comparison_model_calculates_daily_and_weekly_changes, test_update_trending_insights_reads_old_values_and_writes_day_snapshot, test_update_trending_insights_writes_week_snapshot_when_requested, test_update_insights_runs_day_then_weekly_rollover.
- **Details:** functions: _run, test_populate_comparison_model_calculates_daily_and_weekly_changes, test_update_trending_insights_reads_old_values_and_writes_day_snapshot, test_update_trending_insights_writes_week_snapshot_when_requested, test_update_insights_runs_day_then_weekly_rollover

#### `backend/tests/service/test_middleware_service.py`

- **Kind:** backend test
- **Size:** 8053 bytes, 207 lines
- **Summary:** Defines functions _noop_app, _client_with_middleware, test_enforce_https_middleware_updates_request_scheme, test_setup_middlewares_registers_expected_stack, test_cache_admin_sets_no_cache_headers_for_admin_paths; API routes /admin/panel.
- **Details:** functions: _noop_app, _client_with_middleware, test_enforce_https_middleware_updates_request_scheme, test_setup_middlewares_registers_expected_stack, test_cache_admin_sets_no_cache_headers_for_admin_paths, test_content_block_middleware_redirects_dashboard_without_user, test_content_block_middleware_allows_dashboard_with_cookie_session, test_content_security_policy_middleware_skips_docs_paths; api: /admin/panel

#### `backend/tests/service/test_stix_converters.py`

- **Kind:** backend test
- **Size:** 7592 bytes, 208 lines
- **Summary:** Defines functions _objects_by_type, _single, test_wrapper_converters_build_stix_bundle, test_convert_to_stix_builds_full_relationship_graph_for_general_content, test_convert_to_stix_filters_non_http_urls_and_invalid_cve_tokens.
- **Details:** functions: _objects_by_type, _single, test_wrapper_converters_build_stix_bundle, test_convert_to_stix_builds_full_relationship_graph_for_general_content, test_convert_to_stix_filters_non_http_urls_and_invalid_cve_tokens, test_convert_to_stix_uses_now_when_dates_are_invalid_and_never_backdates_modified

### `client`

#### `client/angular.json`

- **Kind:** json data/config
- **Size:** 5975 bytes, 198 lines
- **Summary:** JSON object with 4 top-level keys.
- **Details:** -

#### `client/cypress/e2e/01-init.cy.ts`

- **Kind:** typescript
- **Size:** 189 bytes, 6 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/cypress/e2e/02-login.cy.ts`

- **Kind:** typescript
- **Size:** 418 bytes, 10 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/cypress/e2e/03-flow.cy.ts`

- **Kind:** typescript
- **Size:** 9896 bytes, 253 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/cypress/e2e/04-searching.cy.ts`

- **Kind:** typescript
- **Size:** 10715 bytes, 262 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/cypress/e2e/05-user-management.cy.ts`

- **Kind:** typescript
- **Size:** 12649 bytes, 298 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/cypress/e2e/06-account-management.cy.ts`

- **Kind:** typescript
- **Size:** 4520 bytes, 78 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/cypress/e2e/07-cti-management.cy.ts`

- **Kind:** typescript
- **Size:** 19151 bytes, 414 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/cypress/e2e/08-tenant-management.cy.ts`

- **Kind:** typescript
- **Size:** 12855 bytes, 293 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/cypress/e2e/09-system-management.cy.ts`

- **Kind:** typescript
- **Size:** 1798 bytes, 50 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/cypress/e2e/10-Pagination.cy.ts`

- **Kind:** typescript
- **Size:** 7237 bytes, 209 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/cypress/e2e/11-chatbot.cy.ts`

- **Kind:** typescript
- **Size:** 889 bytes, 18 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/cypress/e2e/12-filter-management.cy.ts`

- **Kind:** typescript
- **Size:** 7116 bytes, 173 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/cypress/e2e/13-consolidated.cy.ts`

- **Kind:** typescript
- **Size:** 14593 bytes, 371 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/cypress/e2e/14-scans-management.cy.ts`

- **Kind:** typescript
- **Size:** 4882 bytes, 117 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/cypress/e2e/15-search-check.cy.ts`

- **Kind:** typescript
- **Size:** 3014 bytes, 85 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/cypress/e2e/16-sidebarfilter-verification.cy.ts`

- **Kind:** typescript
- **Size:** 8810 bytes, 343 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/cypress/e2e/17-feeder-management.cy.ts`

- **Kind:** typescript
- **Size:** 1953 bytes, 65 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/cypress/e2e/18-advanced-filters-report.cy.ts`

- **Kind:** typescript
- **Size:** 1029 bytes, 35 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/cypress/e2e/19-network-intel.cy.ts`

- **Kind:** typescript
- **Size:** 8393 bytes, 245 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/cypress/e2e/controllers/01-init.controller.ts`

- **Kind:** typescript
- **Size:** 107 bytes, 3 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/cypress/e2e/controllers/02-login.controller.ts`

- **Kind:** typescript
- **Size:** 108 bytes, 3 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/cypress/e2e/controllers/03-flow.controller.ts`

- **Kind:** typescript
- **Size:** 8270 bytes, 220 lines
- **Summary:** TypeScript source module.
- **Details:** functions: getSidebarGroupTestId, openSidebarGroup, clickSidebarSubItem, getHeatmapComponent, openHomepage, openCountryReportFromMap, waitForDirectoryRequest, assertDirectoryContentVisible

#### `client/cypress/e2e/controllers/04-searching.controller.ts`

- **Kind:** typescript
- **Size:** 5250 bytes, 150 lines
- **Summary:** TypeScript source module.
- **Details:** functions: getSidebarGroupTestId, openSidebarGroup, clickSidebarSubItem, waitForSearchReady, typeDashboardSearch, openExploitSubmenu, typeExploitSearch, clickOpenReport

#### `client/cypress/e2e/controllers/05-user-management.controller.ts`

- **Kind:** typescript
- **Size:** 9803 bytes, 231 lines
- **Summary:** TypeScript source module.
- **Details:** functions: getSidebarGroupTestId, openSidebarGroup, openSidebarSubItem, setSelect, addUser, loginAsUser, openFirstStrategicReportFromSearch, loginAndClickSidebar

#### `client/cypress/e2e/controllers/06-account-management.controller.ts`

- **Kind:** typescript
- **Size:** 120 bytes, 3 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/cypress/e2e/controllers/07-cti-management.controller.ts`

- **Kind:** typescript
- **Size:** 5043 bytes, 185 lines
- **Summary:** TypeScript source module.
- **Details:** functions: openAndAssertReportModal, invokeVisibleTabBarMethod, waitForToolbarSearchReady, waitForCtiGraphReady, visitCtiGraph, visitSocialGraph, setupSocialGraphInterceptors

#### `client/cypress/e2e/controllers/08-tenant-management.controller.ts`

- **Kind:** typescript
- **Size:** 11973 bytes, 318 lines
- **Summary:** TypeScript source module.
- **Details:** functions: scrollTenantTableToBottomLeft, clickWhenVisible, exportFromModal, closeNotificationSidebar, closeFilterSidebar, openFilterSidebar, approveAllTenants, openTenantsPage

#### `client/cypress/e2e/controllers/09-system-management.controller.ts`

- **Kind:** typescript
- **Size:** 211 bytes, 4 lines
- **Summary:** TypeScript source module.
- **Details:** functions: openSystemSettings

#### `client/cypress/e2e/controllers/10-pagination.controller.ts`

- **Kind:** typescript
- **Size:** 113 bytes, 3 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/cypress/e2e/controllers/11-chatbot.controller.ts`

- **Kind:** typescript
- **Size:** 110 bytes, 3 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/cypress/e2e/controllers/12-filter-management.controller.ts`

- **Kind:** typescript
- **Size:** 1197 bytes, 20 lines
- **Summary:** TypeScript source module.
- **Details:** functions: applyEntityFilter, selectDateRangeAndReopen, selectDateRangeResetAndReopen

#### `client/cypress/e2e/controllers/13-consolidated.controller.ts`

- **Kind:** typescript
- **Size:** 12010 bytes, 259 lines
- **Summary:** TypeScript source module.
- **Details:** functions: executeIocAdvancedSearch, openHomepageAndSearch, switchToDeepSearchTab, switchToIocsTab, searchInIocs, ensureDomainScannerModalOpen, openFirstReportAndGoBack, runDomainScannerFlow

#### `client/cypress/e2e/controllers/14-scans-management.controller.ts`

- **Kind:** typescript
- **Size:** 781 bytes, 15 lines
- **Summary:** TypeScript source module.
- **Details:** functions: fillPrimaryScanInput, fillSecondaryScanInput, clickSearch, makeFileInputInteractable

#### `client/cypress/e2e/controllers/15-search-check.controller.ts`

- **Kind:** typescript
- **Size:** 7433 bytes, 211 lines
- **Summary:** TypeScript source module.
- **Details:** functions: openSidebarGroup15, clickSidebarSubItem15, waitForSearchReady15, typeDashboardSearch15, assertFirstResultCard, assertFirstDefacementRow

#### `client/cypress/e2e/controllers/16-sidebarfilter-verification.controller.ts`

- **Kind:** typescript
- **Size:** 2374 bytes, 74 lines
- **Summary:** TypeScript source module.
- **Details:** functions: waitForSidebar, openSidebar, selectAndApply, assertNetworkValue, assertAnyResultCardMatchesNetwork, openAnyMatchingReport

#### `client/cypress/e2e/controllers/17-feeder-management.controller.ts`

- **Kind:** typescript
- **Size:** 13423 bytes, 373 lines
- **Summary:** TypeScript source module.
- **Details:** functions: openFeederAsAdmin, openFeederAsUser, getFixturePath, getWrongFileCategory, selectFeederRule, assertFeederRuleOptions, openFeederRule, openAddTab

#### `client/cypress/e2e/controllers/18-advanced-filters-report.controller.ts`

- **Kind:** typescript
- **Size:** 6363 bytes, 212 lines
- **Summary:** TypeScript source module.
- **Details:** functions: visitDashboard18, openSidebarGroup18, clickSidebarSubItem18, openAdvancedFiltersPanel18, clearAdvancedFilters18, selectAdvancedFilterCategory18, addAdvancedFilterValue18, submitSearchByEnter18

#### `client/cypress/e2e/controllers/cy-controller.ts`

- **Kind:** typescript
- **Size:** 129 bytes, 3 lines
- **Summary:** TypeScript source module.
- **Details:** functions: createCyController

#### `client/cypress/fixtures/feeder/collector-validation.json`

- **Kind:** json data/config
- **Size:** 2980 bytes, 85 lines
- **Summary:** JSON object with 2 top-level keys.
- **Details:** -

#### `client/cypress/fixtures/feeder/crawl_data_defacement.txt`

- **Kind:** text
- **Size:** 73 bytes, 3 lines
- **Summary:** Text/configuration file.
- **Details:** -

#### `client/cypress/fixtures/feeder/crawl_data_exploit.txt`

- **Kind:** text
- **Size:** 59 bytes, 3 lines
- **Summary:** Text/configuration file.
- **Details:** -

#### `client/cypress/fixtures/feeder/crawl_data_forum.txt`

- **Kind:** text
- **Size:** 109 bytes, 3 lines
- **Summary:** Text/configuration file.
- **Details:** -

#### `client/cypress/fixtures/feeder/crawl_data_generic.txt`

- **Kind:** text
- **Size:** 213 bytes, 3 lines
- **Summary:** Text/configuration file.
- **Details:** -

#### `client/cypress/fixtures/feeder/crawl_data_leak.txt`

- **Kind:** text
- **Size:** 100 bytes, 2 lines
- **Summary:** Text/configuration file.
- **Details:** -

#### `client/cypress/fixtures/feeder/crawl_data_mastodon.txt`

- **Kind:** text
- **Size:** 133 bytes, 3 lines
- **Summary:** Text/configuration file.
- **Details:** -

#### `client/cypress/fixtures/feeder/crawl_data_news.txt`

- **Kind:** text
- **Size:** 88 bytes, 3 lines
- **Summary:** Text/configuration file.
- **Details:** -

#### `client/cypress/fixtures/feeder/crawl_data_pastebin.txt`

- **Kind:** text
- **Size:** 93 bytes, 3 lines
- **Summary:** Text/configuration file.
- **Details:** -

#### `client/cypress/fixtures/feeder/crawl_data_reddit.txt`

- **Kind:** text
- **Size:** 280 bytes, 3 lines
- **Summary:** Text/configuration file.
- **Details:** -

#### `client/cypress/fixtures/feeder/crawl_data_tracking.txt`

- **Kind:** text
- **Size:** 62 bytes, 3 lines
- **Summary:** Text/configuration file.
- **Details:** -

#### `client/cypress/fixtures/feeder/crawl_data_twitter.txt`

- **Kind:** text
- **Size:** 79 bytes, 3 lines
- **Summary:** Text/configuration file.
- **Details:** -

#### `client/cypress/fixtures/feeder/leak/_ransomfeed.py`

- **Kind:** backend python
- **Size:** 367 bytes, 12 lines
- **Summary:** Defines classes _ransomfeed.
- **Details:** classes: _ransomfeed

#### `client/cypress/fixtures/feeder/news/_hackread.py`

- **Kind:** backend python
- **Size:** 353 bytes, 12 lines
- **Summary:** Defines classes _hackread.
- **Details:** classes: _hackread

#### `client/cypress/fixtures/feeder/shared/_mastodon_sample.py`

- **Kind:** backend python
- **Size:** 360 bytes, 12 lines
- **Summary:** Defines classes _mastodon_sample.
- **Details:** classes: _mastodon_sample

#### `client/cypress/fixtures/feeder/shared/_pastebin_sample.py`

- **Kind:** backend python
- **Size:** 353 bytes, 12 lines
- **Summary:** Defines classes _pastebin_sample.
- **Details:** classes: _pastebin_sample

#### `client/cypress/fixtures/feeder/shared/_reddit_sample.py`

- **Kind:** backend python
- **Size:** 405 bytes, 12 lines
- **Summary:** Defines classes _reddit_sample.
- **Details:** classes: _reddit_sample

#### `client/cypress/fixtures/feeder/social/_twitter.py`

- **Kind:** backend python
- **Size:** 406 bytes, 15 lines
- **Summary:** Defines classes _twitter.
- **Details:** classes: _twitter

#### `client/cypress/fixtures/feeder/unique/_defacement_sample.py`

- **Kind:** backend python
- **Size:** 358 bytes, 12 lines
- **Summary:** Defines classes _defacement_sample.
- **Details:** classes: _defacement_sample

#### `client/cypress/fixtures/feeder/unique/_exploit_sample.py`

- **Kind:** backend python
- **Size:** 339 bytes, 12 lines
- **Summary:** Defines classes _exploit_sample.
- **Details:** classes: _exploit_sample

#### `client/cypress/fixtures/feeder/unique/_forum_sample.py`

- **Kind:** backend python
- **Size:** 331 bytes, 12 lines
- **Summary:** Defines classes _forum_sample.
- **Details:** classes: _forum_sample

#### `client/cypress/fixtures/feeder/unique/_tracking_sample.py`

- **Kind:** backend python
- **Size:** 344 bytes, 12 lines
- **Summary:** Defines classes _tracking_sample.
- **Details:** classes: _tracking_sample

#### `client/cypress/fixtures/social-session-sample.json`

- **Kind:** json data/config
- **Size:** 55 bytes, 4 lines
- **Summary:** JSON object with 2 top-level keys.
- **Details:** -

#### `client/cypress/support/commands.ts`

- **Kind:** typescript
- **Size:** 6669 bytes, 165 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/cypress/support/component-index.html`

- **Kind:** angular template
- **Size:** 288 bytes, 12 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/cypress/support/component.ts`

- **Kind:** typescript
- **Size:** 220 bytes, 10 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/cypress/support/constants.ts`

- **Kind:** typescript
- **Size:** 1910 bytes, 38 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/cypress/support/e2e.ts`

- **Kind:** typescript
- **Size:** 5146 bytes, 159 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/cypress/support/index.d.ts`

- **Kind:** typescript
- **Size:** 397 bytes, 13 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/cypress/support/pages.ts`

- **Kind:** typescript
- **Size:** 0 bytes, 0 lines
- **Summary:** File is larger than the analyzer read limit; inventory includes metadata only.
- **Details:** -

#### `client/package.json`

- **Kind:** json data/config
- **Size:** 3415 bytes, 118 lines
- **Summary:** JSON object with 9 top-level keys.
- **Details:** -

#### `client/tailwind.config.ts`

- **Kind:** typescript
- **Size:** 324 bytes, 7 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/tsconfig.json`

- **Kind:** json data/config
- **Size:** 972 bytes, 34 lines
- **Summary:** JSON object with 3 top-level keys.
- **Details:** -

### `client/src/app`

#### `client/src/app/app.config.ts`

- **Kind:** typescript
- **Size:** 1003 bytes, 20 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/app.routes.ts`

- **Kind:** angular routes
- **Size:** 29983 bytes, 815 lines
- **Summary:** Angular route definition with 135 route path entries.
- **Details:** routes: , all, chat/:m_hash, social/:m_hash, general/:m_hash, leak/:m_hash

#### `client/src/app/pages/admin/auditlog/auditlog-list/auditlog-list.component.html`

- **Kind:** angular template
- **Size:** 6862 bytes, 128 lines
- **Summary:** Angular template with 8 test ids.
- **Details:** -

#### `client/src/app/pages/admin/auditlog/auditlog-list/auditlog-list.component.ts`

- **Kind:** angular component
- **Size:** 1711 bytes, 47 lines
- **Summary:** Angular component/directive using selector app-auditlog-list.
- **Details:** classes: AuditlogListComponent; selectors: app-auditlog-list

#### `client/src/app/pages/admin/auditlog/auditlog.component.html`

- **Kind:** angular template
- **Size:** 3133 bytes, 40 lines
- **Summary:** Angular template with 2 test ids.
- **Details:** -

#### `client/src/app/pages/admin/auditlog/auditlog.component.ts`

- **Kind:** angular component
- **Size:** 2467 bytes, 68 lines
- **Summary:** Angular component/directive using selector app-auditlog.
- **Details:** classes: AuditlogComponent; selectors: app-auditlog

#### `client/src/app/pages/app/app.component.html`

- **Kind:** angular template
- **Size:** 1629 bytes, 24 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/pages/app/app.component.ts`

- **Kind:** angular component
- **Size:** 2169 bytes, 55 lines
- **Summary:** Angular component/directive using selector app-root.
- **Details:** classes: AppComponent; selectors: app-root

#### `client/src/app/pages/credentials/credential-list/credential-list.component.html`

- **Kind:** angular template
- **Size:** 9256 bytes, 111 lines
- **Summary:** Angular template with 8 test ids.
- **Details:** -

#### `client/src/app/pages/credentials/credential-list/credential-list.component.ts`

- **Kind:** angular component
- **Size:** 3041 bytes, 86 lines
- **Summary:** Angular component/directive using selector app-credential-list.
- **Details:** classes: CredentialListComponent; selectors: app-credential-list

#### `client/src/app/pages/credentials/credential.component.html`

- **Kind:** angular template
- **Size:** 5974 bytes, 94 lines
- **Summary:** Angular template with 3 test ids.
- **Details:** -

#### `client/src/app/pages/credentials/credential.component.ts`

- **Kind:** angular component
- **Size:** 16010 bytes, 441 lines
- **Summary:** Angular component/directive using selector app-credential.
- **Details:** classes: CredentialComponent; selectors: app-credential

#### `client/src/app/pages/credentials/expanded-row/expanded-row.component.css`

- **Kind:** stylesheet
- **Size:** 20111 bytes, 976 lines
- **Summary:** Stylesheet with 1 selector-like rules.
- **Details:** selectors: .viewport-wrapper

#### `client/src/app/pages/credentials/expanded-row/expanded-row.component.html`

- **Kind:** angular template
- **Size:** 18173 bytes, 291 lines
- **Summary:** Angular template with 29 test ids.
- **Details:** -

#### `client/src/app/pages/credentials/expanded-row/expanded-row.component.scss`

- **Kind:** stylesheet
- **Size:** 19481 bytes, 976 lines
- **Summary:** Stylesheet with 1 selector-like rules.
- **Details:** selectors: .viewport-wrapper

#### `client/src/app/pages/credentials/expanded-row/expanded-row.component.ts`

- **Kind:** angular component
- **Size:** 13521 bytes, 436 lines
- **Summary:** Angular component/directive using selector app-expanded-row.
- **Details:** classes: ExpandedRowComponent; selectors: app-expanded-row

#### `client/src/app/pages/credentials/password-schema/password-schema.component.html`

- **Kind:** angular template
- **Size:** 2960 bytes, 44 lines
- **Summary:** Angular template with 7 test ids.
- **Details:** -

#### `client/src/app/pages/credentials/password-schema/password-schema.component.ts`

- **Kind:** angular component
- **Size:** 2046 bytes, 58 lines
- **Summary:** Angular component/directive using selector app-password-schema.
- **Details:** classes: PasswordSchemaComponent; functions: requires, requires, requires; selectors: app-password-schema

#### `client/src/app/pages/dashboard/dashboard-sidebar/dashboard-collapsed-sidebar/dashboard-sidebar-collapsed.component.css`

- **Kind:** stylesheet
- **Size:** 314 bytes, 13 lines
- **Summary:** Stylesheet with 1 selector-like rules.
- **Details:** selectors: .dashboard-collapsed-nav-btn

#### `client/src/app/pages/dashboard/dashboard-sidebar/dashboard-collapsed-sidebar/dashboard-sidebar-collapsed.component.html`

- **Kind:** angular template
- **Size:** 2742 bytes, 17 lines
- **Summary:** Angular template and 2 router links.
- **Details:** routes: licenseService.canAccess(category()) ? routePrefix() : null, licenseService.canAccess(category()) ? routePrefix() + 

#### `client/src/app/pages/dashboard/dashboard-sidebar/dashboard-collapsed-sidebar/dashboard-sidebar-collapsed.component.ts`

- **Kind:** angular component
- **Size:** 2233 bytes, 61 lines
- **Summary:** Angular component/directive using selector app-dashboard-sidebar-collapsed.
- **Details:** classes: SidebarSectionComponent; selectors: app-dashboard-sidebar-collapsed

#### `client/src/app/pages/dashboard/dashboard-sidebar/dashboard-sidebar-items/dashboard-sidebar-items.component.html`

- **Kind:** angular template
- **Size:** 3279 bytes, 19 lines
- **Summary:** Angular template and 2 router links.
- **Details:** routes: licenseService.canAccess(category()) ? [routePrefix()] : null, licenseService.canAccess(category()) ? [routePrefix(), item.toLowerCase()] : null

#### `client/src/app/pages/dashboard/dashboard-sidebar/dashboard-sidebar-items/dashboard-sidebar-items.component.ts`

- **Kind:** angular component
- **Size:** 1962 bytes, 47 lines
- **Summary:** Angular component/directive using selector app-dashboard-sidebar-items.
- **Details:** classes: DashboardSidebarItemsComponent; selectors: app-dashboard-sidebar-items

#### `client/src/app/pages/dashboard/dashboard-sidebar/dashboard-sidebar.component.html`

- **Kind:** angular template
- **Size:** 26936 bytes, 408 lines
- **Summary:** Angular template with 2 test ids and 2 router links.
- **Details:** routes: canAccessNetworkIntel() && !appService.isMobileMode() ? , canAccessNetworkIntel() && !appService.isMobileMode() ? 

#### `client/src/app/pages/dashboard/dashboard-sidebar/dashboard-sidebar.component.ts`

- **Kind:** angular component
- **Size:** 11033 bytes, 262 lines
- **Summary:** Angular component/directive using selector app-dashboard-sidebar.
- **Details:** classes: DashboardSidebarComponent; functions: requires; selectors: app-dashboard-sidebar

#### `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-event-management/sidebar-user-event-management.component.css`

- **Kind:** stylesheet
- **Size:** 343 bytes, 14 lines
- **Summary:** Stylesheet with 1 selector-like rules.
- **Details:** selectors: .ui-event-management-expand-side

#### `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-event-management/sidebar-user-event-management.component.html`

- **Kind:** angular template
- **Size:** 14372 bytes, 213 lines
- **Summary:** Angular template with 2 test ids.
- **Details:** -

#### `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-event-management/sidebar-user-event-management.component.ts`

- **Kind:** angular component
- **Size:** 8747 bytes, 232 lines
- **Summary:** Angular component/directive using selector app-sidebar-user-event-management.
- **Details:** classes: SidebarUserEventManagementComponent; selectors: app-sidebar-user-event-management

#### `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-feeder/add/sidebar-user-feeder-add.component.html`

- **Kind:** angular template
- **Size:** 13469 bytes, 177 lines
- **Summary:** Angular template with 8 test ids.
- **Details:** -

#### `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-feeder/add/sidebar-user-feeder-add.component.ts`

- **Kind:** angular component
- **Size:** 12325 bytes, 388 lines
- **Summary:** Angular component/directive using selector app-sidebar-user-feeder-add.
- **Details:** classes: SidebarUserFeederAddComponent; selectors: app-sidebar-user-feeder-add

#### `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-feeder/feeder-rule.utils.ts`

- **Kind:** typescript
- **Size:** 271 bytes, 7 lines
- **Summary:** TypeScript source module.
- **Details:** functions: supportsFileUploadForRuleType, supportsValueUploadForRuleType

#### `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-feeder/feeder.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 2708 bytes, 58 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: FeederService

#### `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-feeder/owner-dialog/sidebar-user-feeder-owner-dialog.component.html`

- **Kind:** angular template
- **Size:** 2297 bytes, 36 lines
- **Summary:** Angular template with 4 test ids.
- **Details:** -

#### `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-feeder/owner-dialog/sidebar-user-feeder-owner-dialog.component.ts`

- **Kind:** angular component
- **Size:** 2953 bytes, 80 lines
- **Summary:** Angular component/directive using selector app-sidebar-user-feeder-owner-dialog.
- **Details:** classes: SidebarUserFeederOwnerDialogComponent; selectors: app-sidebar-user-feeder-owner-dialog

#### `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-feeder/sidebar-user-feeder.component.html`

- **Kind:** angular template
- **Size:** 3918 bytes, 55 lines
- **Summary:** Angular template with 5 test ids.
- **Details:** -

#### `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-feeder/sidebar-user-feeder.component.ts`

- **Kind:** angular component
- **Size:** 4000 bytes, 123 lines
- **Summary:** Angular component/directive using selector app-sidebar-user-feeder.
- **Details:** classes: SidebarUserFeederComponent; selectors: app-sidebar-user-feeder

#### `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-feeder/view/sidebar-user-feeder-view.component.html`

- **Kind:** angular template
- **Size:** 42210 bytes, 459 lines
- **Summary:** Angular template with 9 test ids.
- **Details:** -

#### `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-feeder/view/sidebar-user-feeder-view.component.ts`

- **Kind:** angular component
- **Size:** 20044 bytes, 580 lines
- **Summary:** Angular component/directive using selector app-sidebar-user-feeder-view.
- **Details:** classes: SidebarUserFeederViewComponent; selectors: app-sidebar-user-feeder-view

#### `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-homepage/add-custom-alert/add-custom-alert.component.html`

- **Kind:** angular template
- **Size:** 7169 bytes, 73 lines
- **Summary:** Angular template with 9 test ids.
- **Details:** -

#### `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-homepage/add-custom-alert/add-custom-alert.component.ts`

- **Kind:** angular component
- **Size:** 7584 bytes, 179 lines
- **Summary:** Angular component/directive using selector app-add-custom-alert.
- **Details:** classes: AddCustomAlertComponent; selectors: app-add-custom-alert

#### `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-homepage/alert-export-component/alert-export-component.component.html`

- **Kind:** angular template
- **Size:** 2524 bytes, 48 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-homepage/alert-export-component/alert-export-component.component.ts`

- **Kind:** angular component
- **Size:** 2439 bytes, 89 lines
- **Summary:** Angular component/directive using selector app-alert-export-component.
- **Details:** classes: AlertExportComponentComponent; selectors: app-alert-export-component

#### `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-homepage/alert-scan-loading/alert-scan-loading.component.html`

- **Kind:** angular template
- **Size:** 2210 bytes, 24 lines
- **Summary:** Angular template with 1 test ids.
- **Details:** -

#### `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-homepage/alert-scan-loading/alert-scan-loading.component.ts`

- **Kind:** angular component
- **Size:** 1325 bytes, 36 lines
- **Summary:** Angular component/directive using selector app-alert-scan-loading.
- **Details:** classes: AlertScanLoadingComponent; selectors: app-alert-scan-loading

#### `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-homepage/category-alert-report/category-alert-report.component.css`

- **Kind:** stylesheet
- **Size:** 22201 bytes, 966 lines
- **Summary:** Stylesheet with 1 selector-like rules.
- **Details:** selectors: .category_report

#### `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-homepage/category-alert-report/category-alert-report.component.html`

- **Kind:** angular template
- **Size:** 17076 bytes, 255 lines
- **Summary:** Angular template with 5 test ids.
- **Details:** -

#### `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-homepage/category-alert-report/category-alert-report.component.scss`

- **Kind:** stylesheet
- **Size:** 22061 bytes, 987 lines
- **Summary:** Stylesheet with 1 selector-like rules.
- **Details:** selectors: .category_report

#### `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-homepage/category-alert-report/category-alert-report.component.ts`

- **Kind:** angular component
- **Size:** 24698 bytes, 783 lines
- **Summary:** Angular component/directive using selector app-category-alert-report.
- **Details:** classes: CategoryAlertReportComponent; selectors: app-category-alert-report

#### `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-homepage/sidebar-user-homepage.component.html`

- **Kind:** angular template
- **Size:** 12035 bytes, 158 lines
- **Summary:** Angular template with 4 test ids.
- **Details:** -

#### `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-homepage/sidebar-user-homepage.component.ts`

- **Kind:** angular component
- **Size:** 10066 bytes, 273 lines
- **Summary:** Angular component/directive using selector app-sidebar-user-homepage.
- **Details:** classes: SidebarUserHomepageComponent; selectors: app-sidebar-user-homepage

#### `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-ioc/sidebar-user-ioc.component.html`

- **Kind:** angular template
- **Size:** 9170 bytes, 91 lines
- **Summary:** Angular template with 3 test ids.
- **Details:** -

#### `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-ioc/sidebar-user-ioc.component.ts`

- **Kind:** angular component
- **Size:** 4931 bytes, 152 lines
- **Summary:** Angular component/directive using selector app-sidebar-user-ioc.
- **Details:** classes: SidebarUserIocComponent; selectors: app-sidebar-user-ioc

#### `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-settings/account-settings.component.html`

- **Kind:** angular template
- **Size:** 7280 bytes, 95 lines
- **Summary:** Angular template with 5 test ids.
- **Details:** -

#### `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-settings/account-settings.component.ts`

- **Kind:** angular component
- **Size:** 5636 bytes, 165 lines
- **Summary:** Angular component/directive using selector app-sidebar-profile-settings.
- **Details:** classes: AccountSettingsComponent; selectors: app-sidebar-profile-settings

#### `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-settings/sidebar-settings.util.ts`

- **Kind:** typescript
- **Size:** 578 bytes, 33 lines
- **Summary:** TypeScript source module.
- **Details:** functions: getTenantLocationDisplay, toggleEditState

#### `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-settings/tenant-settings/tenant-settings.component.html`

- **Kind:** angular template
- **Size:** 13042 bytes, 189 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-settings/tenant-settings/tenant-settings.component.ts`

- **Kind:** angular component
- **Size:** 3756 bytes, 98 lines
- **Summary:** Angular component/directive using selector app-tenant-settings.
- **Details:** classes: TenantSettingsComponent; selectors: app-tenant-settings

#### `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-settings/user-image-picker/user-image-picker.component.html`

- **Kind:** angular template
- **Size:** 1778 bytes, 15 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-settings/user-image-picker/user-image-picker.component.ts`

- **Kind:** angular component
- **Size:** 2032 bytes, 71 lines
- **Summary:** Angular component/directive using selector app-user-image-picker.
- **Details:** classes: UserImagePickerComponent; selectors: app-user-image-picker

#### `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-statistics/sidebar-user-statistics.component.html`

- **Kind:** angular template
- **Size:** 111 bytes, 3 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-statistics/sidebar-user-statistics.component.ts`

- **Kind:** angular component
- **Size:** 374 bytes, 10 lines
- **Summary:** Angular component/directive using selector app-sidebar-user-statistics.
- **Details:** classes: SidebarUserStatisticsComponent; selectors: app-sidebar-user-statistics

#### `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-system-settings/sidebar-user-system-settings.component.html`

- **Kind:** angular template
- **Size:** 16636 bytes, 229 lines
- **Summary:** Angular template with 5 test ids.
- **Details:** -

#### `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-system-settings/sidebar-user-system-settings.component.ts`

- **Kind:** angular component
- **Size:** 8944 bytes, 201 lines
- **Summary:** Angular component/directive using selector app-sidebar-user-system-settings.
- **Details:** classes: SidebarProfileSystemSettingsComponent; selectors: app-sidebar-user-system-settings

#### `client/src/app/pages/dashboard/dashboard.component.html`

- **Kind:** angular template
- **Size:** 2638 bytes, 42 lines
- **Summary:** Angular template with 13 test ids.
- **Details:** -

#### `client/src/app/pages/dashboard/dashboard.component.ts`

- **Kind:** angular component
- **Size:** 3959 bytes, 102 lines
- **Summary:** Angular component/directive using selector app-dashboard.
- **Details:** classes: DashboardComponent; selectors: app-dashboard

#### `client/src/app/pages/demo-tour/demo-tour/demo-tour.component.css`

- **Kind:** stylesheet
- **Size:** 7134 bytes, 252 lines
- **Summary:** Stylesheet with 0 selector-like rules.
- **Details:** -

#### `client/src/app/pages/demo-tour/demo-tour/demo-tour.component.html`

- **Kind:** angular template
- **Size:** 7275 bytes, 117 lines
- **Summary:** Angular template with 4 test ids.
- **Details:** -

#### `client/src/app/pages/demo-tour/demo-tour/demo-tour.component.ts`

- **Kind:** angular component
- **Size:** 49156 bytes, 1438 lines
- **Summary:** Angular component/directive using selector app-demo-tour.
- **Details:** classes: DemoTourComponent; selectors: app-demo-tour

#### `client/src/app/pages/directory/directory-list/directory-list.component.html`

- **Kind:** angular template
- **Size:** 6040 bytes, 121 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/pages/directory/directory-list/directory-list.component.ts`

- **Kind:** angular component
- **Size:** 2278 bytes, 72 lines
- **Summary:** Angular component/directive using selector app-directory-list.
- **Details:** classes: DirectoryListComponent; selectors: app-directory-list

#### `client/src/app/pages/directory/directory.component.html`

- **Kind:** angular template
- **Size:** 1606 bytes, 31 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/pages/directory/directory.component.ts`

- **Kind:** angular component
- **Size:** 4886 bytes, 147 lines
- **Summary:** Angular component/directive using selector app-directory.
- **Details:** classes: DirectoryComponent; selectors: app-directory

#### `client/src/app/pages/dump/dump-list/dump-list.component.html`

- **Kind:** angular template
- **Size:** 3086 bytes, 64 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/pages/dump/dump-list/dump-list.component.ts`

- **Kind:** angular component
- **Size:** 2052 bytes, 63 lines
- **Summary:** Angular component/directive using selector dump-list.
- **Details:** classes: DumpListComponent; selectors: dump-list

#### `client/src/app/pages/dump/dump.component.html`

- **Kind:** angular template
- **Size:** 2839 bytes, 44 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/pages/dump/dump.component.ts`

- **Kind:** angular component
- **Size:** 1423 bytes, 42 lines
- **Summary:** Angular component/directive using selector app-dump.
- **Details:** classes: DumpComponent; selectors: app-dump

#### `client/src/app/pages/graphs/cti-graph/context-menu/context-menu.component.html`

- **Kind:** angular template
- **Size:** 12 bytes, 1 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/pages/graphs/cti-graph/context-menu/context-menu.component.ts`

- **Kind:** angular component
- **Size:** 5755 bytes, 68 lines
- **Summary:** Angular component/directive using selector app-graph-context-menu.
- **Details:** classes: GraphContextMenuComponent; selectors: app-graph-context-menu

#### `client/src/app/pages/graphs/cti-graph/cti-sidebar/cti-sidebar.component.html`

- **Kind:** angular template
- **Size:** 12 bytes, 1 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/pages/graphs/cti-graph/cti-sidebar/cti-sidebar.component.ts`

- **Kind:** angular component
- **Size:** 1195 bytes, 36 lines
- **Summary:** Angular component/directive using selector app-cti-sidebar.
- **Details:** classes: CtiSidebarComponent; selectors: app-cti-sidebar

#### `client/src/app/pages/graphs/cti-graph/expand-toggle-button/expand-toggle-button.component.html`

- **Kind:** angular template
- **Size:** 575 bytes, 3 lines
- **Summary:** Angular template with 1 test ids.
- **Details:** -

#### `client/src/app/pages/graphs/cti-graph/expand-toggle-button/expand-toggle-button.component.ts`

- **Kind:** angular component
- **Size:** 372 bytes, 11 lines
- **Summary:** Angular component/directive using selector app-expand-toggle-button.
- **Details:** classes: ExpandToggleButtonComponent; selectors: app-expand-toggle-button

#### `client/src/app/pages/graphs/cti-graph/graphs.component.html`

- **Kind:** angular template
- **Size:** 12730 bytes, 222 lines
- **Summary:** Angular template with 3 test ids.
- **Details:** -

#### `client/src/app/pages/graphs/cti-graph/graphs.component.ts`

- **Kind:** angular component
- **Size:** 80162 bytes, 2265 lines
- **Summary:** Angular component/directive using selector app-graphs.
- **Details:** classes: GraphComponent; selectors: app-graphs

#### `client/src/app/pages/graphs/cti-graph/sidebar/sidebar.component.html`

- **Kind:** angular template
- **Size:** 9573 bytes, 80 lines
- **Summary:** Angular template with 3 test ids.
- **Details:** -

#### `client/src/app/pages/graphs/cti-graph/sidebar/sidebar.component.ts`

- **Kind:** angular component
- **Size:** 4846 bytes, 174 lines
- **Summary:** Angular component/directive using selector graph-sidebar.
- **Details:** classes: SidebarComponent; selectors: graph-sidebar

#### `client/src/app/pages/graphs/shared/graph-loading/graph-loading.component.ts`

- **Kind:** angular component
- **Size:** 1802 bytes, 32 lines
- **Summary:** Angular component/directive using selector app-graph-loading.
- **Details:** classes: GraphLoadingComponent; selectors: app-graph-loading

#### `client/src/app/pages/graphs/shared/graph-toolbar/graph-toolbar.component.html`

- **Kind:** angular template
- **Size:** 5585 bytes, 55 lines
- **Summary:** Angular template with 10 test ids.
- **Details:** -

#### `client/src/app/pages/graphs/shared/graph-toolbar/graph-toolbar.component.ts`

- **Kind:** angular component
- **Size:** 1647 bytes, 49 lines
- **Summary:** Angular component/directive using selector app-graph-toolbar.
- **Details:** classes: GraphToolbarComponent; selectors: app-graph-toolbar

#### `client/src/app/pages/graphs/shared/services/social-scan.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 12483 bytes, 327 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: SocialScanService

#### `client/src/app/pages/graphs/shared/services/tab-manager.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 14386 bytes, 450 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: TabManagerService

#### `client/src/app/pages/graphs/shared/sidebar-shell/sidebar-shell.component.html`

- **Kind:** angular template
- **Size:** 1976 bytes, 20 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/pages/graphs/shared/sidebar-shell/sidebar-shell.component.ts`

- **Kind:** angular component
- **Size:** 1109 bytes, 30 lines
- **Summary:** Angular component/directive using selector app-graph-sidebar-shell.
- **Details:** classes: SidebarShellComponent; selectors: app-graph-sidebar-shell

#### `client/src/app/pages/graphs/shared/tab-bar/tab-bar.component.html`

- **Kind:** angular template
- **Size:** 7637 bytes, 88 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/pages/graphs/shared/tab-bar/tab-bar.component.ts`

- **Kind:** angular component
- **Size:** 6499 bytes, 241 lines
- **Summary:** Angular component/directive using selector app-tab-bar.
- **Details:** classes: TabBarComponent; selectors: app-tab-bar

#### `client/src/app/pages/graphs/social-graph/directives/platform-icon-bg.directive.ts`

- **Kind:** angular directive
- **Size:** 1871 bytes, 72 lines
- **Summary:** Angular component/directive using selector [socialMapperPlatformBg].
- **Details:** classes: PlatformIconBgDirective; selectors: [socialMapperPlatformBg]

#### `client/src/app/pages/graphs/social-graph/entity-manager/add-entity-modal/add-entity-modal.component.html`

- **Kind:** angular template
- **Size:** 5390 bytes, 60 lines
- **Summary:** Angular template with 8 test ids.
- **Details:** -

#### `client/src/app/pages/graphs/social-graph/entity-manager/add-entity-modal/add-entity-modal.component.ts`

- **Kind:** angular component
- **Size:** 4459 bytes, 140 lines
- **Summary:** Angular component/directive using selector app-add-entity-modal.
- **Details:** classes: AddEntityModalComponent; selectors: app-add-entity-modal

#### `client/src/app/pages/graphs/social-graph/entity-manager/entity-manager.component.html`

- **Kind:** angular template
- **Size:** 391 bytes, 10 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/pages/graphs/social-graph/entity-manager/entity-manager.component.ts`

- **Kind:** angular component
- **Size:** 13904 bytes, 384 lines
- **Summary:** Angular component/directive using selector app-entity-manager.
- **Details:** classes: EntityManagerComponent; selectors: app-entity-manager

#### `client/src/app/pages/graphs/social-graph/entity-menu/entity-menu.component.html`

- **Kind:** angular template
- **Size:** 8682 bytes, 104 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/pages/graphs/social-graph/entity-menu/entity-menu.component.ts`

- **Kind:** angular component
- **Size:** 2583 bytes, 58 lines
- **Summary:** Angular component/directive using selector app-entity-menu.
- **Details:** classes: EntityMenuComponent; selectors: app-entity-menu

#### `client/src/app/pages/graphs/social-graph/follower-scan-popup/follower-scan-popup.component.html`

- **Kind:** angular template
- **Size:** 16243 bytes, 154 lines
- **Summary:** Angular template with 10 test ids.
- **Details:** -

#### `client/src/app/pages/graphs/social-graph/follower-scan-popup/follower-scan-popup.component.ts`

- **Kind:** angular component
- **Size:** 5630 bytes, 165 lines
- **Summary:** Angular component/directive using selector app-follower-scan-popup.
- **Details:** classes: FollowerScanPopupComponent; selectors: app-follower-scan-popup

#### `client/src/app/pages/graphs/social-graph/graph-search-trigger/graph-search-trigger.component.html`

- **Kind:** angular template
- **Size:** 653 bytes, 3 lines
- **Summary:** Angular template with 1 test ids.
- **Details:** -

#### `client/src/app/pages/graphs/social-graph/graph-search-trigger/graph-search-trigger.component.ts`

- **Kind:** angular component
- **Size:** 390 bytes, 13 lines
- **Summary:** Angular component/directive using selector app-graph-search-trigger.
- **Details:** classes: GraphSearchTriggerComponent; selectors: app-graph-search-trigger

#### `client/src/app/pages/graphs/social-graph/home-menu/home-menu.component.html`

- **Kind:** angular template
- **Size:** 15828 bytes, 229 lines
- **Summary:** Angular template with 4 test ids.
- **Details:** -

#### `client/src/app/pages/graphs/social-graph/home-menu/home-menu.component.ts`

- **Kind:** angular component
- **Size:** 8673 bytes, 253 lines
- **Summary:** Angular component/directive using selector app-home-menu.
- **Details:** classes: HomeMenuComponent; selectors: app-home-menu

#### `client/src/app/pages/graphs/social-graph/list-view/list-view.component.html`

- **Kind:** angular template
- **Size:** 20448 bytes, 236 lines
- **Summary:** Angular template with 6 test ids.
- **Details:** -

#### `client/src/app/pages/graphs/social-graph/list-view/list-view.component.ts`

- **Kind:** angular component
- **Size:** 6761 bytes, 185 lines
- **Summary:** Angular component/directive using selector app-list-view.
- **Details:** classes: ListViewComponent; selectors: app-list-view

#### `client/src/app/pages/graphs/social-graph/metadata-popup/metadata-popup.component.html`

- **Kind:** angular template
- **Size:** 33161 bytes, 463 lines
- **Summary:** Angular template with 18 test ids.
- **Details:** -

#### `client/src/app/pages/graphs/social-graph/metadata-popup/metadata-popup.component.ts`

- **Kind:** angular component
- **Size:** 4121 bytes, 112 lines
- **Summary:** Angular component/directive using selector app-metadata-popup.
- **Details:** classes: MetadataPopupComponent; selectors: app-metadata-popup

#### `client/src/app/pages/graphs/social-graph/network-graph/context-menu/context-menu.component.html`

- **Kind:** angular template
- **Size:** 5495 bytes, 80 lines
- **Summary:** Angular template with 1 test ids.
- **Details:** -

#### `client/src/app/pages/graphs/social-graph/network-graph/context-menu/context-menu.component.ts`

- **Kind:** angular component
- **Size:** 2428 bytes, 80 lines
- **Summary:** Angular component/directive using selector app-context-menu.
- **Details:** classes: ContextMenuComponent; selectors: app-context-menu

#### `client/src/app/pages/graphs/social-graph/network-graph/network-graph.component.html`

- **Kind:** angular template
- **Size:** 2027 bytes, 24 lines
- **Summary:** Angular template with 2 test ids.
- **Details:** -

#### `client/src/app/pages/graphs/social-graph/network-graph/network-graph.component.ts`

- **Kind:** angular component
- **Size:** 29455 bytes, 819 lines
- **Summary:** Angular component/directive using selector app-network-graph.
- **Details:** classes: NetworkGraphComponent; selectors: app-network-graph

#### `client/src/app/pages/graphs/social-graph/notification-bar/notification-bar.component.html`

- **Kind:** angular template
- **Size:** 457 bytes, 8 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/pages/graphs/social-graph/notification-bar/notification-bar.component.ts`

- **Kind:** angular component
- **Size:** 626 bytes, 19 lines
- **Summary:** Angular component/directive using selector app-notification-bar.
- **Details:** classes: NotificationBarComponent; selectors: app-notification-bar

#### `client/src/app/pages/graphs/social-graph/profile-summary-popup/manage-profiles-modal/manage-profiles-modal.component.html`

- **Kind:** angular template
- **Size:** 12045 bytes, 148 lines
- **Summary:** Angular template with 7 test ids.
- **Details:** -

#### `client/src/app/pages/graphs/social-graph/profile-summary-popup/manage-profiles-modal/manage-profiles-modal.component.ts`

- **Kind:** angular component
- **Size:** 9489 bytes, 290 lines
- **Summary:** Angular component/directive using selector app-manage-profiles-modal.
- **Details:** classes: ManageProfilesModalComponent; selectors: app-manage-profiles-modal

#### `client/src/app/pages/graphs/social-graph/profile-summary-popup/profile-summary-popup.component.html`

- **Kind:** angular template
- **Size:** 11784 bytes, 163 lines
- **Summary:** Angular template with 4 test ids.
- **Details:** -

#### `client/src/app/pages/graphs/social-graph/profile-summary-popup/profile-summary-popup.component.ts`

- **Kind:** angular component
- **Size:** 4673 bytes, 114 lines
- **Summary:** Angular component/directive using selector app-profile-summary-popup.
- **Details:** classes: ProfileSummaryPopupComponent; selectors: app-profile-summary-popup

#### `client/src/app/pages/graphs/social-graph/profile-summary-popup/summary-all-platforms-view/summary-all-platforms-view.component.html`

- **Kind:** angular template
- **Size:** 35430 bytes, 494 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/pages/graphs/social-graph/profile-summary-popup/summary-all-platforms-view/summary-all-platforms-view.component.ts`

- **Kind:** angular component
- **Size:** 15513 bytes, 384 lines
- **Summary:** Angular component/directive using selector app-summary-all-platforms-view.
- **Details:** classes: SummaryAllPlatformsViewComponent; selectors: app-summary-all-platforms-view

#### `client/src/app/pages/graphs/social-graph/profile-summary-popup/summary-platform-view/summary-platform-view.component.html`

- **Kind:** angular template
- **Size:** 27729 bytes, 315 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/pages/graphs/social-graph/profile-summary-popup/summary-platform-view/summary-platform-view.component.ts`

- **Kind:** angular component
- **Size:** 4890 bytes, 137 lines
- **Summary:** Angular component/directive using selector app-summary-platform-view.
- **Details:** classes: SummaryPlatformViewComponent; selectors: app-summary-platform-view

#### `client/src/app/pages/graphs/social-graph/relationship-details-popup/relationship-details-popup.component.html`

- **Kind:** angular template
- **Size:** 2900 bytes, 34 lines
- **Summary:** Angular template with 4 test ids.
- **Details:** -

#### `client/src/app/pages/graphs/social-graph/relationship-details-popup/relationship-details-popup.component.ts`

- **Kind:** angular component
- **Size:** 1301 bytes, 33 lines
- **Summary:** Angular component/directive using selector app-relationship-details-popup.
- **Details:** classes: RelationshipDetailsPopupComponent; selectors: app-relationship-details-popup

#### `client/src/app/pages/graphs/social-graph/services/fetching-state.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 1598 bytes, 44 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: FetchingStateService

#### `client/src/app/pages/graphs/social-graph/services/graph-manager.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 9439 bytes, 168 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: GraphManagerService

#### `client/src/app/pages/graphs/social-graph/services/graph-orchestrator.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 22765 bytes, 476 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: GraphOrchestratorService

#### `client/src/app/pages/graphs/social-graph/services/platform-fetch.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 6361 bytes, 129 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: PlatformFetchService

#### `client/src/app/pages/graphs/social-graph/services/relationship-resolver.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 4521 bytes, 115 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: RelationshipResolverService

#### `client/src/app/pages/graphs/social-graph/services/social-entity-ui.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 3619 bytes, 105 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: SocialEntityUiService

#### `client/src/app/pages/graphs/social-graph/services/social-mapper-state.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 9248 bytes, 241 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: SocialMapperStateService

#### `client/src/app/pages/graphs/social-graph/services/social-scan-job.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 7618 bytes, 177 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: SocialScanJobService

#### `client/src/app/pages/graphs/social-graph/services/theme-color.util.ts`

- **Kind:** typescript
- **Size:** 456 bytes, 17 lines
- **Summary:** TypeScript source module.
- **Details:** functions: getSocialGraphLabelColor

#### `client/src/app/pages/graphs/social-graph/social-mapper.component.html`

- **Kind:** angular template
- **Size:** 21200 bytes, 337 lines
- **Summary:** Angular template with 9 test ids.
- **Details:** -

#### `client/src/app/pages/graphs/social-graph/social-mapper.component.ts`

- **Kind:** angular component
- **Size:** 28933 bytes, 738 lines
- **Summary:** Angular component/directive using selector app-social-graph.
- **Details:** classes: SocialMapperComponent; selectors: app-social-graph

#### `client/src/app/pages/graphs/social-graph/utils/platform-feed-view.base.ts`

- **Kind:** typescript
- **Size:** 2804 bytes, 56 lines
- **Summary:** TypeScript module defining PlatformFeedViewBase.
- **Details:** classes: PlatformFeedViewBase

#### `client/src/app/pages/graphs/social-graph/utils/profile-url.util.ts`

- **Kind:** typescript
- **Size:** 2225 bytes, 70 lines
- **Summary:** TypeScript source module.
- **Details:** functions: buildSocialProfileUrl, normalizeUsername, buildKnownPlatformUrl

#### `client/src/app/pages/graphs/social-graph/utils/social-graph-view.util.ts`

- **Kind:** typescript
- **Size:** 3356 bytes, 116 lines
- **Summary:** TypeScript source module.
- **Details:** functions: parsePlatformNodeId, getScanResultsByUsername, getEntityReportRecords, getEntityRecordEntries, toFieldLabel, toDisplayValues, toDisplayValue

#### `client/src/app/pages/graphs/social-graph/utils/social-summary.base.ts`

- **Kind:** typescript
- **Size:** 1763 bytes, 52 lines
- **Summary:** TypeScript module defining SocialSummaryBase.
- **Details:** classes: SocialSummaryBase

#### `client/src/app/pages/graphs/social-graph/utils/summary-view.util.ts`

- **Kind:** typescript
- **Size:** 1785 bytes, 53 lines
- **Summary:** TypeScript source module.
- **Details:** functions: getProfileDetailEntries, getMetadataEntries, addItemsIncrementally, loadMoreIncrementally

#### `client/src/app/pages/homepage/home-insight/home-insight.component.html`

- **Kind:** angular template
- **Size:** 11546 bytes, 186 lines
- **Summary:** Angular template with 1 test ids.
- **Details:** -

#### `client/src/app/pages/homepage/home-insight/home-insight.component.ts`

- **Kind:** angular component
- **Size:** 3589 bytes, 89 lines
- **Summary:** Angular component/directive using selector app-home-insight.
- **Details:** classes: HomeInsightComponent; selectors: app-home-insight

#### `client/src/app/pages/homepage/home-search/home-search.component.html`

- **Kind:** angular template
- **Size:** 12621 bytes, 120 lines
- **Summary:** Angular template with 2 test ids and 1 router links.
- **Details:** routes: [

#### `client/src/app/pages/homepage/home-search/home-search.component.ts`

- **Kind:** angular component
- **Size:** 10429 bytes, 317 lines
- **Summary:** Angular component/directive using selector app-home-search.
- **Details:** classes: HomeSearchComponent; selectors: app-home-search

#### `client/src/app/pages/homepage/homepage.component.html`

- **Kind:** angular template
- **Size:** 241 bytes, 8 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/pages/homepage/homepage.component.ts`

- **Kind:** angular component
- **Size:** 1435 bytes, 39 lines
- **Summary:** Angular component/directive using selector app-index.
- **Details:** classes: HomepageComponent; selectors: app-index

#### `client/src/app/pages/homepage/search-filters/search-filters.component.html`

- **Kind:** angular template
- **Size:** 8914 bytes, 110 lines
- **Summary:** Angular template with 3 test ids.
- **Details:** -

#### `client/src/app/pages/homepage/search-filters/search-filters.component.ts`

- **Kind:** angular component
- **Size:** 8040 bytes, 207 lines
- **Summary:** Angular component/directive using selector app-search-filters.
- **Details:** classes: SearchFiltersComponent; functions: requires, requires; selectors: app-search-filters

#### `client/src/app/pages/homepage/selected-filter-bar/selected-filter-bar.component.html`

- **Kind:** angular template
- **Size:** 6797 bytes, 85 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/pages/homepage/selected-filter-bar/selected-filter-bar.component.ts`

- **Kind:** angular component
- **Size:** 4260 bytes, 124 lines
- **Summary:** Angular component/directive using selector app-selected-filter-bar.
- **Details:** classes: SelectedFilterBarComponent; functions: requires, requires, requires; selectors: app-selected-filter-bar

#### `client/src/app/pages/homepage/world-heatmap/heatmap-report/heatmap-report.component.html`

- **Kind:** angular template
- **Size:** 4482 bytes, 67 lines
- **Summary:** Angular template with 3 test ids.
- **Details:** -

#### `client/src/app/pages/homepage/world-heatmap/heatmap-report/heatmap-report.component.ts`

- **Kind:** angular component
- **Size:** 916 bytes, 32 lines
- **Summary:** Angular component/directive using selector app-heatmap-report.
- **Details:** classes: HeatmapReportComponent; functions: requires, requires; selectors: app-heatmap-report

#### `client/src/app/pages/homepage/world-heatmap/world-heatmap.component.html`

- **Kind:** angular template
- **Size:** 2133 bytes, 19 lines
- **Summary:** Angular template with 2 test ids.
- **Details:** -

#### `client/src/app/pages/homepage/world-heatmap/world-heatmap.component.ts`

- **Kind:** angular component
- **Size:** 22448 bytes, 623 lines
- **Summary:** Angular component/directive using selector app-world-heatmap.
- **Details:** classes: WorldHeatmapComponent; selectors: app-world-heatmap

#### `client/src/app/pages/intel-panel/ai-workspace/ai-summary/ai-summary.component.html`

- **Kind:** angular template
- **Size:** 1455 bytes, 20 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/pages/intel-panel/ai-workspace/ai-summary/ai-summary.component.ts`

- **Kind:** angular component
- **Size:** 2216 bytes, 65 lines
- **Summary:** Angular component/directive using selector app-ai-summary.
- **Details:** classes: AiSummaryComponent; selectors: app-ai-summary

#### `client/src/app/pages/intel-panel/ai-workspace/ai-workspace.component.html`

- **Kind:** angular template
- **Size:** 16876 bytes, 156 lines
- **Summary:** Angular template with 7 test ids and 4 router links.
- **Details:** routes: [, [, [, [

#### `client/src/app/pages/intel-panel/ai-workspace/ai-workspace.component.ts`

- **Kind:** angular component
- **Size:** 8621 bytes, 275 lines
- **Summary:** Angular component/directive using selector app-ai-workspace.
- **Details:** classes: AiWorkspaceComponent; selectors: app-ai-workspace

#### `client/src/app/pages/intel-panel/ai-workspace/chat-widget/chat-widget.component.html`

- **Kind:** angular template
- **Size:** 7714 bytes, 101 lines
- **Summary:** Angular template with 4 test ids.
- **Details:** -

#### `client/src/app/pages/intel-panel/ai-workspace/chat-widget/chat-widget.component.ts`

- **Kind:** angular component
- **Size:** 6552 bytes, 212 lines
- **Summary:** Angular component/directive using selector app-chat-widget.
- **Details:** classes: ChatWidgetComponent; selectors: app-chat-widget

#### `client/src/app/pages/intel-panel/ai-workspace/nexus-chat.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 3423 bytes, 75 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: NexusChatService

#### `client/src/app/pages/intel-panel/dashboard-api/dashboard-api.component.html`

- **Kind:** angular template
- **Size:** 40755 bytes, 465 lines
- **Summary:** Angular template with 17 test ids.
- **Details:** -

#### `client/src/app/pages/intel-panel/dashboard-api/dashboard-api.component.ts`

- **Kind:** angular component
- **Size:** 17191 bytes, 530 lines
- **Summary:** Angular component/directive using selector app-dashboard-api.
- **Details:** classes: DashboardApiComponent; selectors: app-dashboard-api

#### `client/src/app/pages/intel-panel/dashboard-consolidated/consolidated-ioc/consolidated-ioc.component.html`

- **Kind:** angular template
- **Size:** 33 bytes, 1 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/pages/intel-panel/dashboard-consolidated/consolidated-ioc/consolidated-ioc.component.ts`

- **Kind:** angular component
- **Size:** 335 bytes, 10 lines
- **Summary:** Angular component/directive using selector app-consolidated-ioc.
- **Details:** classes: ConsolidatedIocComponent; selectors: app-consolidated-ioc

#### `client/src/app/pages/intel-panel/dashboard-consolidated/consolidated-scan/consolidated-scan.component.html`

- **Kind:** angular template
- **Size:** 11043 bytes, 134 lines
- **Summary:** Angular template with 6 test ids and 1 router links.
- **Details:** routes: { seo: 

#### `client/src/app/pages/intel-panel/dashboard-consolidated/consolidated-scan/consolidated-scan.component.ts`

- **Kind:** angular component
- **Size:** 8338 bytes, 267 lines
- **Summary:** Angular component/directive using selector app-consolidated-scan.
- **Details:** classes: ConsolidatedScanComponent; selectors: app-consolidated-scan

#### `client/src/app/pages/intel-panel/dashboard-consolidated/dashboard-consolidated.component.html`

- **Kind:** angular template
- **Size:** 8342 bytes, 136 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/pages/intel-panel/dashboard-consolidated/dashboard-consolidated.component.ts`

- **Kind:** angular component
- **Size:** 17173 bytes, 415 lines
- **Summary:** Angular component/directive using selector app-dashboard-consolidated.
- **Details:** classes: DashboardConsolidatedComponent; selectors: app-dashboard-consolidated

#### `client/src/app/pages/intel-panel/dashboard-consolidated/defacement-results/threat-results.component.html`

- **Kind:** angular template
- **Size:** 22732 bytes, 235 lines
- **Summary:** Angular template with 6 test ids.
- **Details:** -

#### `client/src/app/pages/intel-panel/dashboard-consolidated/defacement-results/threat-results.component.ts`

- **Kind:** angular component
- **Size:** 6888 bytes, 191 lines
- **Summary:** Angular component/directive using selector app-defacement-results.
- **Details:** classes: ThreatResultsComponent; selectors: app-defacement-results

#### `client/src/app/pages/intel-panel/dashboard-manager.utils.ts`

- **Kind:** typescript
- **Size:** 554 bytes, 15 lines
- **Summary:** TypeScript source module.
- **Details:** functions: applyQueryAndPageFromParams, isRouteChanged

#### `client/src/app/pages/intel-panel/dashboard-result-container/dashboard-result-container.component.html`

- **Kind:** angular template
- **Size:** 3084 bytes, 83 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/pages/intel-panel/dashboard-result-container/dashboard-result-container.component.ts`

- **Kind:** angular component
- **Size:** 8246 bytes, 210 lines
- **Summary:** Angular component/directive using selector app-dashboard-result-container.
- **Details:** classes: DashboardResultContainer; selectors: app-dashboard-result-container

#### `client/src/app/pages/intel-panel/dashboard-results/dashboard-result-chat/dashboard-result-chat.component.html`

- **Kind:** angular template
- **Size:** 7887 bytes, 138 lines
- **Summary:** Angular template with 4 test ids and 1 router links.
- **Details:** routes: [currentUrl, item.m_hash]

#### `client/src/app/pages/intel-panel/dashboard-results/dashboard-result-chat/dashboard-result-chat.component.ts`

- **Kind:** angular component
- **Size:** 2628 bytes, 70 lines
- **Summary:** Angular component/directive using selector app-dashboard-result-chat.
- **Details:** classes: DashboardResultChatComponent; selectors: app-dashboard-result-chat

#### `client/src/app/pages/intel-panel/dashboard-results/dashboard-result-defacement/dashboard-result-defacement.component.html`

- **Kind:** angular template
- **Size:** 10823 bytes, 138 lines
- **Summary:** Angular template with 2 test ids and 2 router links.
- **Details:** routes: [currentUrl, item.m_hash], [currentUrl, item.m_hash]

#### `client/src/app/pages/intel-panel/dashboard-results/dashboard-result-defacement/dashboard-result-defacement.component.ts`

- **Kind:** angular component
- **Size:** 4094 bytes, 111 lines
- **Summary:** Angular component/directive using selector app-dashboard-result-defacement.
- **Details:** classes: DashboardResultDefacementComponent; selectors: app-dashboard-result-defacement

#### `client/src/app/pages/intel-panel/dashboard-results/dashboard-result-exploit/dashboard-result-exploit.component.html`

- **Kind:** angular template
- **Size:** 10390 bytes, 167 lines
- **Summary:** Angular template with 4 test ids and 1 router links.
- **Details:** routes: [currentUrl, item.m_hash]

#### `client/src/app/pages/intel-panel/dashboard-results/dashboard-result-exploit/dashboard-result-exploit.component.ts`

- **Kind:** angular component
- **Size:** 2015 bytes, 58 lines
- **Summary:** Angular component/directive using selector app-dashboard-result-exploit.
- **Details:** classes: DashboardResultExploitComponent; selectors: app-dashboard-result-exploit

#### `client/src/app/pages/intel-panel/dashboard-results/dashboard-result-social/dashboard-result-social.component.html`

- **Kind:** angular template
- **Size:** 7139 bytes, 111 lines
- **Summary:** Angular template with 4 test ids and 1 router links.
- **Details:** routes: [currentUrl, item.m_hash]

#### `client/src/app/pages/intel-panel/dashboard-results/dashboard-result-social/dashboard-result-social.component.ts`

- **Kind:** angular component
- **Size:** 3189 bytes, 91 lines
- **Summary:** Angular component/directive using selector app-dashboard-result-social.
- **Details:** classes: DashboardResultSocialComponent; selectors: app-dashboard-result-social

#### `client/src/app/pages/intel-panel/dashboard-results/dashboard-results-general-grid/dashboard-results-general.component.html`

- **Kind:** angular template
- **Size:** 7743 bytes, 95 lines
- **Summary:** Angular template with 5 test ids and 1 router links.
- **Details:** routes: [currentUrl, item.m_hash]

#### `client/src/app/pages/intel-panel/dashboard-results/dashboard-results-general-grid/dashboard-results-general.component.ts`

- **Kind:** angular component
- **Size:** 3756 bytes, 89 lines
- **Summary:** Angular component/directive using selector app-dashboard-results-general-grid.
- **Details:** classes: DashboardResultsGeneralComponent; selectors: app-dashboard-results-general-grid

#### `client/src/app/pages/intel-panel/ioc-extractor/file-scanner.component.html`

- **Kind:** angular template
- **Size:** 14768 bytes, 197 lines
- **Summary:** Angular template with 6 test ids.
- **Details:** -

#### `client/src/app/pages/intel-panel/ioc-extractor/file-scanner.component.ts`

- **Kind:** angular component
- **Size:** 11077 bytes, 342 lines
- **Summary:** Angular component/directive using selector app-ioc-extractor.
- **Details:** classes: FileScannerComponent; selectors: app-ioc-extractor

#### `client/src/app/pages/intel-panel/ioc-extractor/file-scanner.constants.ts`

- **Kind:** typescript
- **Size:** 1687 bytes, 25 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/pages/intel-panel/result-insights/result-insights.component.html`

- **Kind:** angular template
- **Size:** 8890 bytes, 133 lines
- **Summary:** Angular template with 9 test ids.
- **Details:** -

#### `client/src/app/pages/intel-panel/result-insights/result-insights.component.ts`

- **Kind:** angular component
- **Size:** 13526 bytes, 362 lines
- **Summary:** Angular component/directive using selector app-result-insights.
- **Details:** classes: ResultInsightsComponent; selectors: app-result-insights

#### `client/src/app/pages/intel-panel/text-analysis/text-analysis.component.html`

- **Kind:** angular template
- **Size:** 16894 bytes, 184 lines
- **Summary:** Angular template with 9 test ids.
- **Details:** -

#### `client/src/app/pages/intel-panel/text-analysis/text-analysis.component.ts`

- **Kind:** angular component
- **Size:** 7135 bytes, 238 lines
- **Summary:** Angular component/directive using selector app-text-analysis.
- **Details:** classes: TextAnalysisComponent; selectors: app-text-analysis

#### `client/src/app/pages/login/login-container/login-container.component.css`

- **Kind:** stylesheet
- **Size:** 196 bytes, 7 lines
- **Summary:** Stylesheet with 1 selector-like rules.
- **Details:** selectors: .twofa-bg

#### `client/src/app/pages/login/login-container/login-container.component.html`

- **Kind:** angular template
- **Size:** 11410 bytes, 140 lines
- **Summary:** Angular template with 7 test ids.
- **Details:** -

#### `client/src/app/pages/login/login-container/login-container.component.ts`

- **Kind:** angular component
- **Size:** 5318 bytes, 167 lines
- **Summary:** Angular component/directive using selector app-login-container.
- **Details:** classes: LoginContainerComponent; selectors: app-login-container

#### `client/src/app/pages/login/login.component.html`

- **Kind:** angular template
- **Size:** 79 bytes, 3 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/pages/login/login.component.ts`

- **Kind:** angular component
- **Size:** 328 bytes, 12 lines
- **Summary:** Angular component/directive using selector app-login-header.
- **Details:** classes: LoginComponent; selectors: app-login-header

#### `client/src/app/pages/network-intel/dns-section/dns-section.component.html`

- **Kind:** angular template
- **Size:** 7102 bytes, 97 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/pages/network-intel/dns-section/dns-section.component.ts`

- **Kind:** angular component
- **Size:** 3454 bytes, 105 lines
- **Summary:** Angular component/directive using selector app-network-intel-dns-section.
- **Details:** classes: DnsSectionComponent; selectors: app-network-intel-dns-section

#### `client/src/app/pages/network-intel/ip-detail/ip-detail.component.html`

- **Kind:** angular template
- **Size:** 28268 bytes, 400 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/pages/network-intel/ip-detail/ip-detail.component.ts`

- **Kind:** angular component
- **Size:** 4768 bytes, 122 lines
- **Summary:** Angular component/directive using selector app-ip-detail.
- **Details:** classes: IpDetailComponent; selectors: app-ip-detail

#### `client/src/app/pages/network-intel/modal/geo-coordinates-modal/geo-coordinates-modal.component.html`

- **Kind:** angular template
- **Size:** 12756 bytes, 119 lines
- **Summary:** Angular template with 20 test ids.
- **Details:** -

#### `client/src/app/pages/network-intel/modal/geo-coordinates-modal/geo-coordinates-modal.component.scss`

- **Kind:** stylesheet
- **Size:** 1513 bytes, 41 lines
- **Summary:** Stylesheet with 1 selector-like rules.
- **Details:** selectors: .light-theme

#### `client/src/app/pages/network-intel/modal/geo-coordinates-modal/geo-coordinates-modal.component.ts`

- **Kind:** angular component
- **Size:** 11213 bytes, 357 lines
- **Summary:** Angular component/directive using selector app-geo-coordinates-modal.
- **Details:** classes: GeoCoordinatesModalComponent; functions: requires, requires, requires; selectors: app-geo-coordinates-modal

#### `client/src/app/pages/network-intel/network-intel-service.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 11785 bytes, 337 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: ScanHelperMethodsService

#### `client/src/app/pages/network-intel/network-intel.html`

- **Kind:** angular template
- **Size:** 10464 bytes, 149 lines
- **Summary:** Angular template with 7 test ids.
- **Details:** -

#### `client/src/app/pages/network-intel/network-intel.ts`

- **Kind:** angular component
- **Size:** 45160 bytes, 1276 lines
- **Summary:** Angular component/directive using selector app-network-intel.
- **Details:** classes: NetworkIntel; selectors: app-network-intel

#### `client/src/app/pages/network-intel/shodan-section/shodan-section.component.html`

- **Kind:** angular template
- **Size:** 3073 bytes, 51 lines
- **Summary:** Angular template with 1 test ids.
- **Details:** -

#### `client/src/app/pages/network-intel/shodan-section/shodan-section.component.ts`

- **Kind:** angular component
- **Size:** 2317 bytes, 61 lines
- **Summary:** Angular component/directive using selector app-network-intel-shodan-section.
- **Details:** classes: ShodanSectionComponent; selectors: app-network-intel-shodan-section

#### `client/src/app/pages/network-intel/vulnerability-section/vulnerability-section.component.html`

- **Kind:** angular template
- **Size:** 8940 bytes, 132 lines
- **Summary:** Angular template with 1 test ids.
- **Details:** -

#### `client/src/app/pages/network-intel/vulnerability-section/vulnerability-section.component.ts`

- **Kind:** angular component
- **Size:** 6517 bytes, 162 lines
- **Summary:** Angular component/directive using selector app-network-intel-vulnerability-section.
- **Details:** classes: VulnerabilitySectionComponent; selectors: app-network-intel-vulnerability-section

#### `client/src/app/pages/profile/user-profile-activity/user-profile-activity.component.html`

- **Kind:** angular template
- **Size:** 8289 bytes, 134 lines
- **Summary:** Angular template with 1 test ids.
- **Details:** -

#### `client/src/app/pages/profile/user-profile-activity/user-profile-activity.component.ts`

- **Kind:** angular component
- **Size:** 2366 bytes, 71 lines
- **Summary:** Angular component/directive using selector app-user-profile-activity.
- **Details:** classes: UserProfileActivityComponent; selectors: app-user-profile-activity

#### `client/src/app/pages/security-scan/scanner-service.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 1131 bytes, 30 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: ScannerService

#### `client/src/app/pages/security-scan/security-scan-export-component/security-scan-export-component.component.html`

- **Kind:** angular template
- **Size:** 3253 bytes, 55 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/pages/security-scan/security-scan-export-component/security-scan-export-component.component.ts`

- **Kind:** angular component
- **Size:** 2080 bytes, 66 lines
- **Summary:** Angular component/directive using selector app-security-scan-export-component.
- **Details:** classes: SecurityScanExportComponentComponent; selectors: app-security-scan-export-component

#### `client/src/app/pages/security-scan/security-scan.component.html`

- **Kind:** angular template
- **Size:** 20151 bytes, 221 lines
- **Summary:** Angular template with 6 test ids.
- **Details:** -

#### `client/src/app/pages/security-scan/security-scan.component.ts`

- **Kind:** angular component
- **Size:** 11425 bytes, 320 lines
- **Summary:** Angular component/directive using selector app-security-scan.
- **Details:** classes: SecurityScanComponent; selectors: app-security-scan

#### `client/src/app/pages/signup/signup.component.html`

- **Kind:** angular template
- **Size:** 7280 bytes, 89 lines
- **Summary:** Angular template with 6 test ids.
- **Details:** -

#### `client/src/app/pages/signup/signup.component.ts`

- **Kind:** angular component
- **Size:** 4057 bytes, 114 lines
- **Summary:** Angular component/directive using selector app-signup.
- **Details:** classes: SignupComponent; selectors: app-signup

#### `client/src/app/pages/tenant/tenant-management/add-tenant/add-tenant.component.css`

- **Kind:** stylesheet
- **Size:** 3762 bytes, 169 lines
- **Summary:** Stylesheet with 0 selector-like rules.
- **Details:** -

#### `client/src/app/pages/tenant/tenant-management/add-tenant/add-tenant.component.html`

- **Kind:** angular template
- **Size:** 7719 bytes, 105 lines
- **Summary:** Angular template with 6 test ids.
- **Details:** -

#### `client/src/app/pages/tenant/tenant-management/add-tenant/add-tenant.component.scss`

- **Kind:** stylesheet
- **Size:** 45 bytes, 1 lines
- **Summary:** Stylesheet with 0 selector-like rules.
- **Details:** -

#### `client/src/app/pages/tenant/tenant-management/add-tenant/add-tenant.component.ts`

- **Kind:** angular component
- **Size:** 5899 bytes, 152 lines
- **Summary:** Angular component/directive using selector app-add-tenant.
- **Details:** classes: AddTenantComponent; functions: requires, requires; selectors: app-add-tenant

#### `client/src/app/pages/tenant/tenant-management/view-profile/manage-profile.component.html`

- **Kind:** angular template
- **Size:** 26356 bytes, 327 lines
- **Summary:** Angular template with 4 test ids.
- **Details:** -

#### `client/src/app/pages/tenant/tenant-management/view-profile/manage-profile.component.ts`

- **Kind:** angular component
- **Size:** 6027 bytes, 171 lines
- **Summary:** Angular component/directive using selector app-view-profile.
- **Details:** classes: ManageProfileComponent; selectors: app-view-profile

#### `client/src/app/pages/tenant/tenant-management/view-tenant.component-shared.css`

- **Kind:** stylesheet
- **Size:** 5119 bytes, 272 lines
- **Summary:** Stylesheet with 1 selector-like rules.
- **Details:** selectors: .view-tenant-container

#### `client/src/app/pages/tenant/tenant-management/view-tenant.component-shared.scss`

- **Kind:** stylesheet
- **Size:** 5133 bytes, 272 lines
- **Summary:** Stylesheet with 1 selector-like rules.
- **Details:** selectors: .view-tenant-container

#### `client/src/app/pages/tenant/tenant-management/view-tenant/view-tenant.component.html`

- **Kind:** angular template
- **Size:** 28630 bytes, 345 lines
- **Summary:** Angular template with 9 test ids.
- **Details:** -

#### `client/src/app/pages/tenant/tenant-management/view-tenant/view-tenant.component.ts`

- **Kind:** angular component
- **Size:** 4787 bytes, 148 lines
- **Summary:** Angular component/directive using selector app-view-tenant.
- **Details:** classes: ViewTenantComponent; selectors: app-view-tenant

#### `client/src/app/pages/tenant/tenant.component.html`

- **Kind:** angular template
- **Size:** 14379 bytes, 202 lines
- **Summary:** Angular template with 4 test ids.
- **Details:** -

#### `client/src/app/pages/tenant/tenant.component.ts`

- **Kind:** angular component
- **Size:** 5059 bytes, 153 lines
- **Summary:** Angular component/directive using selector app-tenant.
- **Details:** classes: TenantComponent; selectors: app-tenant

#### `client/src/app/pages/welcome/welcome.component.html`

- **Kind:** angular template
- **Size:** 1321 bytes, 12 lines
- **Summary:** Angular template with 2 test ids.
- **Details:** -

#### `client/src/app/pages/welcome/welcome.component.ts`

- **Kind:** angular component
- **Size:** 2369 bytes, 60 lines
- **Summary:** Angular component/directive using selector app-welcome.
- **Details:** classes: WelcomeComponent; selectors: app-welcome

#### `client/src/app/sections/report/social-interactions/models/public-user-data.model.ts`

- **Kind:** typescript model
- **Size:** 661 bytes, 30 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/sections/report/social-interactions/report-feedback-comments/report-feedback-comments.component.html`

- **Kind:** angular template
- **Size:** 5018 bytes, 65 lines
- **Summary:** Angular template with 4 test ids.
- **Details:** -

#### `client/src/app/sections/report/social-interactions/report-feedback-comments/report-feedback-comments.component.ts`

- **Kind:** angular component
- **Size:** 1215 bytes, 44 lines
- **Summary:** Angular component/directive using selector app-report-feedback-comments.
- **Details:** classes: ReportFeedbackCommentsComponent; selectors: app-report-feedback-comments

#### `client/src/app/sections/report/social-interactions/report-feedback/report-feedback.component.html`

- **Kind:** angular template
- **Size:** 4020 bytes, 41 lines
- **Summary:** Angular template with 3 test ids.
- **Details:** -

#### `client/src/app/sections/report/social-interactions/report-feedback/report-feedback.component.ts`

- **Kind:** angular component
- **Size:** 1147 bytes, 34 lines
- **Summary:** Angular component/directive using selector app-report-feedback.
- **Details:** classes: ReportFeedbackComponent; selectors: app-report-feedback

#### `client/src/app/sections/report/social-interactions/report-interaction-host/report-interaction-host.component.html`

- **Kind:** angular template
- **Size:** 535 bytes, 6 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/sections/report/social-interactions/report-interaction-host/report-interaction-host.component.ts`

- **Kind:** angular component
- **Size:** 2500 bytes, 65 lines
- **Summary:** Angular component/directive using selector app-report-interaction-host.
- **Details:** classes: ReportInteractionHostComponent; selectors: app-report-interaction-host

#### `client/src/app/sections/report/social-interactions/report-user-sidebar/report-user-sidebar.component.html`

- **Kind:** angular template
- **Size:** 7870 bytes, 119 lines
- **Summary:** Angular template with 2 test ids.
- **Details:** -

#### `client/src/app/sections/report/social-interactions/report-user-sidebar/report-user-sidebar.component.ts`

- **Kind:** angular component
- **Size:** 2236 bytes, 86 lines
- **Summary:** Angular component/directive using selector app-report-user-sidebar.
- **Details:** classes: ReportUserSidebarComponent; selectors: app-report-user-sidebar

#### `client/src/app/sections/report/templates/report-chat/report-chat.component.html`

- **Kind:** angular template
- **Size:** 14401 bytes, 199 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/sections/report/templates/report-chat/report-chat.component.ts`

- **Kind:** angular component
- **Size:** 8386 bytes, 233 lines
- **Summary:** Angular component/directive using selector app-report-chat.
- **Details:** classes: ReportChatComponent; selectors: app-report-chat

#### `client/src/app/sections/report/templates/report-defacement/report-defacement.component.html`

- **Kind:** angular template
- **Size:** 8298 bytes, 106 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/sections/report/templates/report-defacement/report-defacement.component.ts`

- **Kind:** angular component
- **Size:** 4763 bytes, 128 lines
- **Summary:** Angular component/directive using selector app-report-defacement.
- **Details:** classes: ReportDefacementComponent; selectors: app-report-defacement

#### `client/src/app/sections/report/templates/report_general/models/report-feedback.model.ts`

- **Kind:** typescript model
- **Size:** 1283 bytes, 44 lines
- **Summary:** TypeScript module defining ReportFeedbackCommentModel, ReportFeedbackReactionModel, ReportFeedbackModel.
- **Details:** classes: ReportFeedbackCommentModel, ReportFeedbackReactionModel, ReportFeedbackModel

#### `client/src/app/sections/report/templates/report_general/report.component.html`

- **Kind:** angular template
- **Size:** 11517 bytes, 176 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/sections/report/templates/report_general/report.component.ts`

- **Kind:** angular component
- **Size:** 7641 bytes, 201 lines
- **Summary:** Angular component/directive using selector app-result-panel.
- **Details:** classes: ReportComponent; selectors: app-result-panel

#### `client/src/app/services/alerts/alerts.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 3883 bytes, 130 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: AlertService

#### `client/src/app/services/auditlog/auditlog.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 1497 bytes, 42 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: AuditlogService

#### `client/src/app/services/authetication/auth.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 6856 bytes, 230 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: AuthService

#### `client/src/app/services/authetication/token-refresh.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 1252 bytes, 36 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: TokenRefreshService

#### `client/src/app/services/core/app/app-storage.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 2517 bytes, 68 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: AppStorageService

#### `client/src/app/services/core/app/app.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 8558 bytes, 270 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: AppService

#### `client/src/app/services/core/http.interceptor.ts`

- **Kind:** typescript
- **Size:** 4457 bytes, 118 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/services/dashboard/dashboard.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 13052 bytes, 301 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: DashboardService

#### `client/src/app/services/dashboard/selection.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 3509 bytes, 96 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: SelectionStoreService

#### `client/src/app/services/dashboard/sidebar.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 1716 bytes, 58 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: SidebarHomepageService

#### `client/src/app/services/dashboard/subscription.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 1181 bytes, 40 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: SubscriptionService

#### `client/src/app/services/directory/directory.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 1020 bytes, 31 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: DirectoryService

#### `client/src/app/services/dump/dump.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 1591 bytes, 47 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: DumpService

#### `client/src/app/services/entity_filter_suggestions/suggestions.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 612 bytes, 19 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: SuggestionService

#### `client/src/app/services/home_search/home.search.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 1906 bytes, 57 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: HomeSearchService

#### `client/src/app/services/licenses/licenses.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 4704 bytes, 169 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: LicenseService

#### `client/src/app/services/message_notification/message-notification.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 648 bytes, 20 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: MessageNotificationService

#### `client/src/app/shared/animations/advanced.row.motion.animation.ts`

- **Kind:** typescript
- **Size:** 474 bytes, 11 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/animations/app.animations.ts`

- **Kind:** typescript
- **Size:** 488 bytes, 14 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/animations/chat.bot.animation.ts`

- **Kind:** typescript
- **Size:** 311 bytes, 7 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/animations/chat.overlay.animation.ts`

- **Kind:** typescript
- **Size:** 334 bytes, 11 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/animations/dashboard.global.animations.ts`

- **Kind:** typescript
- **Size:** 348 bytes, 7 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/animations/dashboard.item.animation.ts`

- **Kind:** typescript
- **Size:** 320 bytes, 7 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/animations/filter.animation.ts`

- **Kind:** typescript
- **Size:** 339 bytes, 10 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/animations/message.notification.animation.ts`

- **Kind:** typescript
- **Size:** 485 bytes, 11 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/animations/popup.animations.ts`

- **Kind:** typescript
- **Size:** 677 bytes, 19 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/animations/row.animations.ts`

- **Kind:** typescript
- **Size:** 348 bytes, 7 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/animations/scan.animations.ts`

- **Kind:** typescript
- **Size:** 497 bytes, 10 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/animations/search.filter.animation.ts`

- **Kind:** typescript
- **Size:** 436 bytes, 10 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/animations/sidebar.animations.ts`

- **Kind:** typescript
- **Size:** 683 bytes, 19 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/animations/sidebar.mode.animation.ts`

- **Kind:** typescript
- **Size:** 381 bytes, 9 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/components/social-icon/social-icon.component.ts`

- **Kind:** angular component
- **Size:** 836 bytes, 28 lines
- **Summary:** Angular component/directive using selector app-social-icon.
- **Details:** classes: SocialIconComponent; selectors: app-social-icon

#### `client/src/app/shared/constants/filters.ts`

- **Kind:** typescript
- **Size:** 6441 bytes, 235 lines
- **Summary:** TypeScript source module.
- **Details:** functions: createThreatContent

#### `client/src/app/shared/constants/pages.ts`

- **Kind:** typescript
- **Size:** 2562 bytes, 107 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/constants/shared-enums.ts`

- **Kind:** typescript
- **Size:** 3093 bytes, 101 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/directive/base.listing.directive.ts`

- **Kind:** angular directive
- **Size:** 3809 bytes, 108 lines
- **Summary:** TypeScript module defining BaseListingComponent.
- **Details:** classes: BaseListingComponent

#### `client/src/app/shared/directive/focus.directive.ts`

- **Kind:** angular directive
- **Size:** 299 bytes, 11 lines
- **Summary:** Angular component/directive using selector [triggerAutoFocus].
- **Details:** classes: FocusDirective; selectors: [triggerAutoFocus]

#### `client/src/app/shared/directive/tooltip-directive.directive.ts`

- **Kind:** angular directive
- **Size:** 5395 bytes, 168 lines
- **Summary:** Angular component/directive using selector [appTooltip].
- **Details:** classes: TooltipDirective; selectors: [appTooltip]

#### `client/src/app/shared/directives/autofocus.directive.ts`

- **Kind:** angular directive
- **Size:** 374 bytes, 14 lines
- **Summary:** Angular component/directive using selector [appAutofocus].
- **Details:** classes: AutofocusDirective; selectors: [appAutofocus]

#### `client/src/app/shared/guards/auth-guard.guard.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 1156 bytes, 22 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: AuthGuard

#### `client/src/app/shared/guards/notification.guard.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 1049 bytes, 28 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: NotificationGuard

#### `client/src/app/shared/guards/onboarding-guar.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 679 bytes, 17 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: OnboardingGuard

#### `client/src/app/shared/guards/subscription.guard.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 920 bytes, 18 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: subscriptionGuard

#### `client/src/app/shared/guards/tenant-guard.guard.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 542 bytes, 15 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: TenantGuard

#### `client/src/app/shared/icons/bootstrap-icon-registry.ts`

- **Kind:** typescript
- **Size:** 60446 bytes, 310 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/model/alert-notification/alert.notification.model.ts`

- **Kind:** typescript model
- **Size:** 758 bytes, 34 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/model/api/email/search_dynamic_email_callback_model.ts`

- **Kind:** typescript model
- **Size:** 1180 bytes, 48 lines
- **Summary:** TypeScript module defining CardData, SearchDynamicEmailCallbackModel.
- **Details:** classes: CardData, SearchDynamicEmailCallbackModel

#### `client/src/app/shared/model/app/config.ts`

- **Kind:** typescript model
- **Size:** 3882 bytes, 75 lines
- **Summary:** TypeScript module defining AppSettingsModel, LocalSettingsModel, ConfigSettings.
- **Details:** classes: AppSettingsModel, LocalSettingsModel, ConfigSettings

#### `client/src/app/shared/model/auditlog/auditlog.model.ts`

- **Kind:** typescript model
- **Size:** 243 bytes, 12 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/model/auth/auth.model.ts`

- **Kind:** typescript model
- **Size:** 139 bytes, 6 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/model/chat/ai-workspace-message.model.ts`

- **Kind:** typescript model
- **Size:** 145 bytes, 7 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/model/chat/chat-api-response.model.ts`

- **Kind:** typescript model
- **Size:** 135 bytes, 7 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/model/company-profile/node.model.ts`

- **Kind:** typescript model
- **Size:** 1931 bytes, 81 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/model/demo-tour/demo.tour.model.ts`

- **Kind:** typescript model
- **Size:** 667 bytes, 25 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/model/demo-tour/modal/rendered-geometry.interface.ts`

- **Kind:** typescript model
- **Size:** 185 bytes, 8 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/model/directory/directory.model.ts`

- **Kind:** typescript model
- **Size:** 361 bytes, 14 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/model/dump/dump.mode.ts`

- **Kind:** typescript model
- **Size:** 295 bytes, 13 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/model/filter/calendar-cell.model.ts`

- **Kind:** typescript model
- **Size:** 90 bytes, 5 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/model/filter/filter.model.ts`

- **Kind:** typescript model
- **Size:** 447 bytes, 23 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/model/graph/cti-graph.model.ts`

- **Kind:** typescript model
- **Size:** 1080 bytes, 43 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/model/graph/ruleset_model.ts`

- **Kind:** typescript model
- **Size:** 800 bytes, 34 lines
- **Summary:** TypeScript source module.
- **Details:** functions: getDefaultRuleSet, loadRuleSetFromStorage, saveRuleSetToStorage

#### `client/src/app/shared/model/homepage/consolidation_insights.ts`

- **Kind:** typescript model
- **Size:** 93 bytes, 5 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/model/homepage/country-insight.model.ts`

- **Kind:** typescript model
- **Size:** 216 bytes, 13 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/model/homepage/document_insight.model.ts`

- **Kind:** typescript model
- **Size:** 406 bytes, 16 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/model/homepage/stats_insight.model.ts`

- **Kind:** typescript model
- **Size:** 1349 bytes, 44 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/model/ioc-extractor/ioc.extractor.model.ts`

- **Kind:** typescript model
- **Size:** 1207 bytes, 58 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/model/licenses/license.rules.ts`

- **Kind:** typescript model
- **Size:** 269 bytes, 10 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/model/network-intel/network-intel-api.models.ts`

- **Kind:** typescript model
- **Size:** 829 bytes, 43 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/model/network-intel/network-intel.model.ts`

- **Kind:** typescript model
- **Size:** 4051 bytes, 145 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/model/profile/feeder.model.ts`

- **Kind:** typescript model
- **Size:** 1386 bytes, 62 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/model/report/export-choice.model.ts`

- **Kind:** typescript model
- **Size:** 965 bytes, 36 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/model/report/report-export.model.ts`

- **Kind:** typescript model
- **Size:** 968 bytes, 45 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/model/results/callback.init.ts`

- **Kind:** typescript model
- **Size:** 323 bytes, 7 lines
- **Summary:** TypeScript source module.
- **Details:** functions: initCallbackModel

#### `client/src/app/shared/model/results/chat/chat.callback.model.ts`

- **Kind:** typescript model
- **Size:** 1167 bytes, 47 lines
- **Summary:** TypeScript module defining ChatResultItem, ChatCallbackModel.
- **Details:** classes: ChatResultItem, ChatCallbackModel

#### `client/src/app/shared/model/results/consolidated/consolidated.callback.model.ts`

- **Kind:** typescript model
- **Size:** 2606 bytes, 51 lines
- **Summary:** TypeScript module defining ConsolidatedCallbackModel.
- **Details:** classes: ConsolidatedCallbackModel

#### `client/src/app/shared/model/results/consolidated/consolidated.param.model.ts`

- **Kind:** typescript model
- **Size:** 569 bytes, 31 lines
- **Summary:** TypeScript module defining ConsolidatedParamModel.
- **Details:** classes: ConsolidatedParamModel

#### `client/src/app/shared/model/results/consolidated/ranked.callback.model.ts`

- **Kind:** typescript model
- **Size:** 316 bytes, 13 lines
- **Summary:** TypeScript module defining RankedCallbackModel.
- **Details:** classes: RankedCallbackModel

#### `client/src/app/shared/model/results/credentials/credential.callback.model.ts`

- **Kind:** typescript model
- **Size:** 646 bytes, 28 lines
- **Summary:** TypeScript module defining StealerLogResultItem, StealerLogCallbackModel.
- **Details:** classes: StealerLogResultItem, StealerLogCallbackModel

#### `client/src/app/shared/model/results/cross-search/cross-search.model.ts`

- **Kind:** typescript model
- **Size:** 400 bytes, 22 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/model/results/defacement/defacement.callback.model.ts`

- **Kind:** typescript model
- **Size:** 768 bytes, 32 lines
- **Summary:** TypeScript module defining DefacementResultItem, DefacementCallbackModel.
- **Details:** classes: DefacementResultItem, DefacementCallbackModel

#### `client/src/app/shared/model/results/exploit/exploit.callback.model.ts`

- **Kind:** typescript model
- **Size:** 995 bytes, 41 lines
- **Summary:** TypeScript module defining ExploitResultItem, ExploitCallbackModel.
- **Details:** classes: ExploitResultItem, ExploitCallbackModel

#### `client/src/app/shared/model/results/general/general.callback.model.ts`

- **Kind:** typescript model
- **Size:** 1355 bytes, 51 lines
- **Summary:** TypeScript module defining GeneralResultItem, GeneralCallbackModel.
- **Details:** classes: GeneralResultItem, GeneralCallbackModel

#### `client/src/app/shared/model/results/leak/leak.callback.model.ts`

- **Kind:** typescript model
- **Size:** 1062 bytes, 42 lines
- **Summary:** TypeScript module defining LeakResultItem, LeakCallbackModel.
- **Details:** classes: LeakResultItem, LeakCallbackModel

#### `client/src/app/shared/model/results/social/social.callback.model.ts`

- **Kind:** typescript model
- **Size:** 1224 bytes, 49 lines
- **Summary:** TypeScript module defining SocialResultItem, SocialCallbackModel.
- **Details:** classes: SocialResultItem, SocialCallbackModel

#### `client/src/app/shared/model/scanners/scanner.models.ts`

- **Kind:** typescript model
- **Size:** 1042 bytes, 46 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/model/security-scan/finding-row.model.ts`

- **Kind:** typescript model
- **Size:** 162 bytes, 9 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/model/security-scan/security.scan.results.model.ts`

- **Kind:** typescript model
- **Size:** 814 bytes, 35 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/model/social/social-scan.models.ts`

- **Kind:** typescript model
- **Size:** 4904 bytes, 191 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/model/stealerlogs-filter/stealerlogs-filters.ts`

- **Kind:** typescript model
- **Size:** 1044 bytes, 33 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/model/tenant/tenant.model.ts`

- **Kind:** typescript model
- **Size:** 1226 bytes, 48 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/partials/alert-notification/alert-notification.component.html`

- **Kind:** angular template
- **Size:** 6439 bytes, 87 lines
- **Summary:** Angular template with 4 test ids.
- **Details:** -

#### `client/src/app/shared/partials/alert-notification/alert-notification.component.ts`

- **Kind:** angular component
- **Size:** 9479 bytes, 277 lines
- **Summary:** Angular component/directive using selector app-alert-notification.
- **Details:** classes: AlertNotificationComponent; functions: requires; selectors: app-alert-notification

#### `client/src/app/shared/partials/code-block/code-block.component.html`

- **Kind:** angular template
- **Size:** 1682 bytes, 25 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/shared/partials/code-block/code-block.component.ts`

- **Kind:** angular component
- **Size:** 507 bytes, 20 lines
- **Summary:** Angular component/directive using selector app-code-block.
- **Details:** classes: CodeBlockComponent; selectors: app-code-block

#### `client/src/app/shared/partials/confirmation-popup/confirmation-popup.component.html`

- **Kind:** angular template
- **Size:** 809 bytes, 14 lines
- **Summary:** Angular template with 2 test ids.
- **Details:** -

#### `client/src/app/shared/partials/confirmation-popup/confirmation-popup.component.ts`

- **Kind:** angular component
- **Size:** 838 bytes, 30 lines
- **Summary:** Angular component/directive using selector app-confirmation-popup.
- **Details:** classes: ConfirmationPopupComponent; selectors: app-confirmation-popup

#### `client/src/app/shared/partials/empty-query/empty-query.component.html`

- **Kind:** angular template
- **Size:** 554 bytes, 5 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/shared/partials/empty-query/empty-query.component.ts`

- **Kind:** angular component
- **Size:** 219 bytes, 8 lines
- **Summary:** Angular component/directive using selector app-empty-query.
- **Details:** classes: EmptyQueryComponent; selectors: app-empty-query

#### `client/src/app/shared/partials/empty-result/empty-result.component.html`

- **Kind:** angular template
- **Size:** 1957 bytes, 15 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/shared/partials/empty-result/empty-result.component.ts`

- **Kind:** angular component
- **Size:** 451 bytes, 18 lines
- **Summary:** Angular component/directive using selector app-empty-result.
- **Details:** classes: EmptyResultComponent; selectors: app-empty-result

#### `client/src/app/shared/partials/error-handler/error-handler.component.css`

- **Kind:** stylesheet
- **Size:** 392 bytes, 6 lines
- **Summary:** Stylesheet with 0 selector-like rules.
- **Details:** -

#### `client/src/app/shared/partials/error-handler/error-handler.component.html`

- **Kind:** angular template
- **Size:** 1845 bytes, 27 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/shared/partials/error-handler/error-handler.component.ts`

- **Kind:** angular component
- **Size:** 212 bytes, 8 lines
- **Summary:** Angular component/directive using selector app-error-handler.
- **Details:** classes: ErrorHandlerComponent; selectors: app-error-handler

#### `client/src/app/shared/partials/export-choice-modal/export-choice-modal.component.html`

- **Kind:** angular template
- **Size:** 1698 bytes, 23 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/shared/partials/export-choice-modal/export-choice-modal.component.ts`

- **Kind:** angular component
- **Size:** 1257 bytes, 37 lines
- **Summary:** Angular component/directive using selector app-export-choice-modal.
- **Details:** classes: ExportChoiceModalComponent; functions: requires; selectors: app-export-choice-modal

#### `client/src/app/shared/partials/filters/date-picker/date-picker.component.html`

- **Kind:** angular template
- **Size:** 2751 bytes, 38 lines
- **Summary:** Angular template with 4 test ids.
- **Details:** -

#### `client/src/app/shared/partials/filters/date-picker/date-picker.component.ts`

- **Kind:** angular component
- **Size:** 4931 bytes, 186 lines
- **Summary:** Angular component/directive using selector app-date-picker.
- **Details:** classes: DatePickerComponent; selectors: app-date-picker

#### `client/src/app/shared/partials/filters/filters.component.html`

- **Kind:** angular template
- **Size:** 3340 bytes, 46 lines
- **Summary:** Angular template with 3 test ids.
- **Details:** -

#### `client/src/app/shared/partials/filters/filters.component.ts`

- **Kind:** angular component
- **Size:** 3519 bytes, 97 lines
- **Summary:** Angular component/directive using selector app-filters.
- **Details:** classes: FiltersComponent; functions: requires, requires; selectors: app-filters

#### `client/src/app/shared/partials/forgot-password/reset-password.component.html`

- **Kind:** angular template
- **Size:** 3498 bytes, 77 lines
- **Summary:** Angular template with 4 test ids.
- **Details:** -

#### `client/src/app/shared/partials/forgot-password/reset-password.component.ts`

- **Kind:** angular component
- **Size:** 3583 bytes, 100 lines
- **Summary:** Angular component/directive using selector app-forgot-password.
- **Details:** classes: ResetPasswordComponent; selectors: app-forgot-password

#### `client/src/app/shared/partials/header/dashboard-header/dashboard-header.component.html`

- **Kind:** angular template
- **Size:** 3295 bytes, 44 lines
- **Summary:** Angular template with 1 test ids.
- **Details:** -

#### `client/src/app/shared/partials/header/dashboard-header/dashboard-header.component.ts`

- **Kind:** angular component
- **Size:** 4624 bytes, 107 lines
- **Summary:** Angular component/directive using selector app-dashboard-header.
- **Details:** classes: DashboardHeaderComponent; selectors: app-dashboard-header

#### `client/src/app/shared/partials/header/login-header/header.component.html`

- **Kind:** angular template
- **Size:** 1068 bytes, 10 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/shared/partials/header/login-header/header.component.ts`

- **Kind:** angular component
- **Size:** 700 bytes, 25 lines
- **Summary:** Angular component/directive using selector app-header.
- **Details:** classes: HeaderComponent; selectors: app-header

#### `client/src/app/shared/partials/ioc-search/ioc-search.component.html`

- **Kind:** angular template
- **Size:** 8517 bytes, 93 lines
- **Summary:** Angular template with 11 test ids.
- **Details:** -

#### `client/src/app/shared/partials/ioc-search/ioc-search.component.ts`

- **Kind:** angular component
- **Size:** 10573 bytes, 305 lines
- **Summary:** Angular component/directive using selector app-ioc-search.
- **Details:** classes: IocSearchComponent; selectors: app-ioc-search

#### `client/src/app/shared/partials/json-api-viewer/json-api-viewer.component.html`

- **Kind:** angular template
- **Size:** 2620 bytes, 27 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/shared/partials/json-api-viewer/json-api-viewer.component.ts`

- **Kind:** angular component
- **Size:** 1204 bytes, 39 lines
- **Summary:** Angular component/directive using selector app-json-api-viewer.
- **Details:** classes: JsonApiViewerComponent; selectors: app-json-api-viewer

#### `client/src/app/shared/partials/json-api-viewer/json-viewer/json-viewer.component.html`

- **Kind:** angular template
- **Size:** 4294 bytes, 73 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/shared/partials/json-api-viewer/json-viewer/json-viewer.component.ts`

- **Kind:** angular component
- **Size:** 3531 bytes, 137 lines
- **Summary:** Angular component/directive using selector app-json-viewer.
- **Details:** classes: JsonViewerComponent; selectors: app-json-viewer

#### `client/src/app/shared/partials/loader/loader.component.html`

- **Kind:** angular template
- **Size:** 349 bytes, 5 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/shared/partials/loader/loader.component.ts`

- **Kind:** angular component
- **Size:** 527 bytes, 20 lines
- **Summary:** Angular component/directive using selector app-loader.
- **Details:** classes: LoaderComponent; selectors: app-loader

#### `client/src/app/shared/partials/loading-form/loading-form.component.html`

- **Kind:** angular template
- **Size:** 2140 bytes, 32 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/shared/partials/loading-form/loading-form.component.ts`

- **Kind:** angular component
- **Size:** 223 bytes, 9 lines
- **Summary:** Angular component/directive using selector app-loading-form.
- **Details:** classes: LoadingFormComponent; selectors: app-loading-form

#### `client/src/app/shared/partials/message-notification/message-notification.component.html`

- **Kind:** angular template
- **Size:** 1864 bytes, 13 lines
- **Summary:** Angular template with 3 test ids.
- **Details:** -

#### `client/src/app/shared/partials/message-notification/message-notification.component.ts`

- **Kind:** angular component
- **Size:** 667 bytes, 18 lines
- **Summary:** Angular component/directive using selector app-message-notification.
- **Details:** classes: MessageNotificationComponent; selectors: app-message-notification

#### `client/src/app/shared/partials/message-popup/message-popup.component.html`

- **Kind:** angular template
- **Size:** 569 bytes, 9 lines
- **Summary:** Angular template with 1 test ids.
- **Details:** -

#### `client/src/app/shared/partials/message-popup/message-popup.component.ts`

- **Kind:** angular component
- **Size:** 604 bytes, 21 lines
- **Summary:** Angular component/directive using selector app-message-popup.
- **Details:** classes: MessagePopupComponent; selectors: app-message-popup

#### `client/src/app/shared/partials/notification/notification.component.html`

- **Kind:** angular template
- **Size:** 1215 bytes, 14 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/shared/partials/notification/notification.component.ts`

- **Kind:** angular component
- **Size:** 901 bytes, 29 lines
- **Summary:** Angular component/directive using selector app-notification.
- **Details:** classes: NotificationComponent; selectors: app-notification

#### `client/src/app/shared/partials/onion-search-engine/cross-search-card.component.html`

- **Kind:** angular template
- **Size:** 13391 bytes, 174 lines
- **Summary:** Angular template with 4 test ids.
- **Details:** -

#### `client/src/app/shared/partials/onion-search-engine/cross-search-card.component.ts`

- **Kind:** angular component
- **Size:** 5159 bytes, 164 lines
- **Summary:** Angular component/directive using selector app-cross-search-card.
- **Details:** classes: CrossSearchCardComponent; selectors: app-cross-search-card

#### `client/src/app/shared/partials/pagination/pagination.component.html`

- **Kind:** angular template
- **Size:** 3241 bytes, 20 lines
- **Summary:** Angular template with 5 test ids.
- **Details:** -

#### `client/src/app/shared/partials/pagination/pagination.component.ts`

- **Kind:** angular component
- **Size:** 1696 bytes, 45 lines
- **Summary:** Angular component/directive using selector app-pagination.
- **Details:** classes: PaginationComponent; selectors: app-pagination

#### `client/src/app/shared/partials/pro-subscription/pro-subscription.component.html`

- **Kind:** angular template
- **Size:** 7292 bytes, 93 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/shared/partials/pro-subscription/pro-subscription.component.ts`

- **Kind:** angular component
- **Size:** 1482 bytes, 46 lines
- **Summary:** Angular component/directive using selector app-pro-subscription.
- **Details:** classes: ProSubscriptionComponent; functions: requires; selectors: app-pro-subscription

#### `client/src/app/shared/partials/profile/profile.component.html`

- **Kind:** angular template
- **Size:** 6077 bytes, 81 lines
- **Summary:** Angular template with 4 test ids.
- **Details:** -

#### `client/src/app/shared/partials/profile/profile.component.ts`

- **Kind:** angular component
- **Size:** 4467 bytes, 141 lines
- **Summary:** Angular component/directive using selector app-profile.
- **Details:** classes: ProfileComponent; functions: requires; selectors: app-profile

#### `client/src/app/shared/partials/report-header/report-header.component.html`

- **Kind:** angular template
- **Size:** 4246 bytes, 56 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/shared/partials/report-header/report-header.component.ts`

- **Kind:** angular component
- **Size:** 5070 bytes, 142 lines
- **Summary:** Angular component/directive using selector app-report-header.
- **Details:** classes: ReportHeaderComponent; selectors: app-report-header

#### `client/src/app/shared/partials/report-mapping/report-mapping.component.html`

- **Kind:** angular template
- **Size:** 5198 bytes, 77 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/shared/partials/report-mapping/report-mapping.component.ts`

- **Kind:** angular component
- **Size:** 4203 bytes, 118 lines
- **Summary:** Angular component/directive using selector app-report-mapping.
- **Details:** classes: ReportMappingComponent; selectors: app-report-mapping

#### `client/src/app/shared/partials/result-components/result-list/result-list.component.html`

- **Kind:** angular template
- **Size:** 988 bytes, 17 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/shared/partials/result-components/result-list/result-list.component.ts`

- **Kind:** angular component
- **Size:** 879 bytes, 31 lines
- **Summary:** Angular component/directive using selector app-result-list.
- **Details:** classes: ResultListComponent; selectors: app-result-list

#### `client/src/app/shared/partials/result-components/result-section/result-section.component.html`

- **Kind:** angular template
- **Size:** 408 bytes, 8 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/shared/partials/result-components/result-section/result-section.component.ts`

- **Kind:** angular component
- **Size:** 482 bytes, 18 lines
- **Summary:** Angular component/directive using selector app-result-section.
- **Details:** classes: ResultSectionComponent; selectors: app-result-section

#### `client/src/app/shared/partials/result/result.component.html`

- **Kind:** angular template
- **Size:** 16307 bytes, 187 lines
- **Summary:** Angular template with 16 test ids and 1 router links.
- **Details:** routes: /dashboard/breach/databases

#### `client/src/app/shared/partials/result/result.component.ts`

- **Kind:** angular component
- **Size:** 12741 bytes, 331 lines
- **Summary:** Angular component/directive using selector app-result.
- **Details:** classes: ResultComponent; functions: requires; selectors: app-result

#### `client/src/app/shared/partials/scan-helper-methods/scan-helper-methods-service.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 5028 bytes, 134 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: ScanHelperMethodsService

#### `client/src/app/shared/partials/scan-helper-methods/scan-helper-methods.component.html`

- **Kind:** angular template
- **Size:** 19581 bytes, 183 lines
- **Summary:** Angular template with 9 test ids.
- **Details:** -

#### `client/src/app/shared/partials/scan-helper-methods/scan-helper-methods.component.ts`

- **Kind:** angular component
- **Size:** 9007 bytes, 284 lines
- **Summary:** Angular component/directive using selector app-scan-helper.
- **Details:** classes: ScanHelperMethods; functions: requires; selectors: app-scan-helper

#### `client/src/app/shared/partials/scroll-top/scroll-top.component.html`

- **Kind:** angular template
- **Size:** 262 bytes, 1 lines
- **Summary:** Angular template.
- **Details:** -

#### `client/src/app/shared/partials/scroll-top/scroll-top.component.ts`

- **Kind:** angular component
- **Size:** 648 bytes, 21 lines
- **Summary:** Angular component/directive using selector app-scroll-top.
- **Details:** classes: ScrollTopComponent; selectors: app-scroll-top

#### `client/src/app/shared/partials/support/support.component.html`

- **Kind:** angular template
- **Size:** 3627 bytes, 61 lines
- **Summary:** Angular template with 9 test ids.
- **Details:** -

#### `client/src/app/shared/partials/support/support.component.ts`

- **Kind:** angular component
- **Size:** 2465 bytes, 78 lines
- **Summary:** Angular component/directive using selector app-support.
- **Details:** classes: SupportComponent; functions: requires; selectors: app-support

#### `client/src/app/shared/partials/trail-notification/trail-notification.component.html`

- **Kind:** angular template
- **Size:** 626 bytes, 10 lines
- **Summary:** Angular template with 1 test ids.
- **Details:** -

#### `client/src/app/shared/partials/trail-notification/trail-notification.component.ts`

- **Kind:** angular component
- **Size:** 454 bytes, 15 lines
- **Summary:** Angular component/directive using selector app-trail-notification.
- **Details:** classes: TrailNotificationComponent; selectors: app-trail-notification

#### `client/src/app/shared/pipes/highlight-html.pipe.ts`

- **Kind:** angular pipe
- **Size:** 217 bytes, 7 lines
- **Summary:** TypeScript module defining HighlightHtmlPipe.
- **Details:** classes: HighlightHtmlPipe

#### `client/src/app/shared/pipes/lower.pipe.ts`

- **Kind:** angular pipe
- **Size:** 225 bytes, 9 lines
- **Summary:** TypeScript module defining LowerPipe.
- **Details:** classes: LowerPipe

#### `client/src/app/shared/pipes/normalize-unicode.pipe.ts`

- **Kind:** angular pipe
- **Size:** 4064 bytes, 60 lines
- **Summary:** TypeScript module defining NormalizeUnicodePipe.
- **Details:** classes: NormalizeUnicodePipe; functions: normalizeUnicode

#### `client/src/app/shared/pipes/remove-emojis-pipe.pipe.ts`

- **Kind:** angular pipe
- **Size:** 342 bytes, 10 lines
- **Summary:** TypeScript module defining RemoveEmojisPipe.
- **Details:** classes: RemoveEmojisPipe

#### `client/src/app/shared/pipes/sort-grouped-results.pipe.ts`

- **Kind:** angular pipe
- **Size:** 573 bytes, 17 lines
- **Summary:** TypeScript module defining SortGroupedResultsPipe.
- **Details:** classes: SortGroupedResultsPipe

#### `client/src/app/shared/resolvers/config.resolver.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 1019 bytes, 22 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: ConfigResolver

#### `client/src/app/shared/resolvers/consolidated.resolver.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 1876 bytes, 55 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: ReportConsolidatedResolver

#### `client/src/app/shared/resolvers/dashboard.resolver.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 1059 bytes, 25 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: DashboardResolver

#### `client/src/app/shared/resolvers/insight.resolver.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 820 bytes, 19 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: InsightResolver

#### `client/src/app/shared/resolvers/ioc.resolver.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 929 bytes, 24 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: IocResolver

#### `client/src/app/shared/resolvers/report.resolver.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 2209 bytes, 63 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: ReportResolver

#### `client/src/app/shared/resolvers/session-data-resolver.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 959 bytes, 26 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: NodeResolver

#### `client/src/app/shared/services/api.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 989 bytes, 26 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: ApiService

#### `client/src/app/shared/services/consolidated.api.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 6493 bytes, 169 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: ConsolidatedApiService

#### `client/src/app/shared/services/demo.tour.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 3208 bytes, 117 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: DemoTourService

#### `client/src/app/shared/services/error-store.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 1178 bytes, 41 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: ErrorStoreService

#### `client/src/app/shared/services/export/alert-export.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 2380 bytes, 68 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: AlertExportService

#### `client/src/app/shared/services/export/document-export.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 9122 bytes, 185 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: DocumentExportService

#### `client/src/app/shared/services/export/export-shared.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 1412 bytes, 54 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: ExportSharedService

#### `client/src/app/shared/services/export/graph-export.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 37780 bytes, 929 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: GraphExportService

#### `client/src/app/shared/services/export/report-export.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 5234 bytes, 130 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: ReportExportService

#### `client/src/app/shared/services/helper.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 9457 bytes, 275 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: HelperService

#### `client/src/app/shared/services/icon.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 7383 bytes, 213 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: IconService

#### `client/src/app/shared/services/insight-cache.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 730 bytes, 31 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: InsightCacheService

#### `client/src/app/shared/services/loading.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 374 bytes, 18 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: LoadingService

#### `client/src/app/shared/services/proxy-controller.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 3035 bytes, 102 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: ProxyController

#### `client/src/app/shared/services/report-export.service.ts`

- **Kind:** typescript
- **Size:** 70 bytes, 1 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/services/result-row-helper.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 2960 bytes, 112 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: ResultRowHelperService

#### `client/src/app/shared/services/scroll.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 6005 bytes, 150 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: ScrollService

#### `client/src/app/shared/services/sidebar.service.ts`

- **Kind:** angular service/resolver/guard
- **Size:** 425 bytes, 18 lines
- **Summary:** Angular injectable service, resolver, or guard.
- **Details:** classes: SidebarService

#### `client/src/app/shared/services/tab-manager.service.ts`

- **Kind:** typescript
- **Size:** 92 bytes, 1 lines
- **Summary:** TypeScript source module.
- **Details:** -

#### `client/src/app/shared/styles/alert-stagger-animations.scss`

- **Kind:** stylesheet
- **Size:** 567 bytes, 33 lines
- **Summary:** Stylesheet with 0 selector-like rules.
- **Details:** -

#### `client/src/app/shared/utils/auth-form.util.ts`

- **Kind:** typescript
- **Size:** 3261 bytes, 111 lines
- **Summary:** TypeScript source module.
- **Details:** functions: createEmptyPasswordChecks, areAllPasswordRequirementsMet, buildUsernameSuggestions, buildUsernameSuggestionText, evaluatePasswordInput

#### `client/src/app/shared/utils/ensure-stylesheet.util.ts`

- **Kind:** typescript
- **Size:** 427 bytes, 15 lines
- **Summary:** TypeScript source module.
- **Details:** functions: ensureStylesheet

#### `client/src/app/shared/utils/file-input.util.ts`

- **Kind:** typescript
- **Size:** 1346 bytes, 43 lines
- **Summary:** TypeScript source module.
- **Details:** functions: getFirstFileFromInputEvent, readTextInputValue, readFile, readFileAsText, readFileAsDataUrl

#### `client/src/app/shared/utils/filter-values.util.ts`

- **Kind:** typescript
- **Size:** 291 bytes, 11 lines
- **Summary:** TypeScript source module.
- **Details:** functions: countFilterValues

#### `client/src/app/shared/utils/formatters.ts`

- **Kind:** typescript
- **Size:** 1217 bytes, 39 lines
- **Summary:** TypeScript source module.
- **Details:** functions: getPlatformColor, formatFollowers, formatKey, isUrl, isImageUrl

#### `client/src/app/shared/utils/intel-report.util.ts`

- **Kind:** typescript
- **Size:** 2921 bytes, 111 lines
- **Summary:** TypeScript source module.
- **Details:** functions: getDiffInDays, isWithinDays, getStatusText, getStatusFlag, formatKeyLabel, isLikelyUrl, formatTitleUrl, getDisplayTitle

#### `client/src/app/shared/utils/value-presentation.base.ts`

- **Kind:** typescript
- **Size:** 2610 bytes, 88 lines
- **Summary:** TypeScript module defining ValuePresentationBase.
- **Details:** classes: ValuePresentationBase

### `docker-compose-testing.yml`

#### `docker-compose-testing.yml`

- **Kind:** configuration
- **Size:** 5831 bytes, 222 lines
- **Summary:** Text/configuration file.
- **Details:** -

### `docker-compose.yml`

#### `docker-compose.yml`

- **Kind:** configuration
- **Size:** 5837 bytes, 223 lines
- **Summary:** Text/configuration file.
- **Details:** -

### `docs`

#### `docs/api_docs/ALL.md`

- **Kind:** documentation
- **Size:** 129522 bytes, 2990 lines
- **Summary:** Documentation page: System Info.
- **Details:** routes: /api/search/breach/screenshot/{m_screenshot}, /api/search/defacement; api: /api/search/breach/screenshot/{m_screenshot}, /api/search/defacement

#### `docs/api_docs/IOC_DOC.md`

- **Kind:** documentation
- **Size:** 1504 bytes, 40 lines
- **Summary:** Documentation page: IOC / Enrichment Fields.
- **Details:** -

#### `docs/api_docs/README.md`

- **Kind:** documentation
- **Size:** 1721 bytes, 133 lines
- **Summary:** Documentation page: Orion API Documentation.
- **Details:** -

#### `docs/api_docs/convert_to_md.py`

- **Kind:** backend python
- **Size:** 2890 bytes, 83 lines
- **Summary:** Lossless export of docs.py dicts to a Markdown folder structure
- **Details:** functions: main

#### `docs/api_docs/dynamic/apk_scan.md`

- **Kind:** documentation
- **Size:** 3395 bytes, 91 lines
- **Summary:** Documentation page: Dynamic: dynamic_apk_scan.
- **Details:** -

#### `docs/api_docs/dynamic/crypto_scan.md`

- **Kind:** documentation
- **Size:** 3992 bytes, 100 lines
- **Summary:** Documentation page: Dynamic: dynamic_crypto_scan.
- **Details:** -

#### `docs/api_docs/dynamic/deep_ip_scan.md`

- **Kind:** documentation
- **Size:** 22433 bytes, 615 lines
- **Summary:** Documentation page: Dynamic: Deep_ip_scan.
- **Details:** routes: /ISAPI/System/deviceInfo

#### `docs/api_docs/dynamic/domain_scan.md`

- **Kind:** documentation
- **Size:** 3743 bytes, 118 lines
- **Summary:** Documentation page: Dynamic: domain_scan.
- **Details:** -

#### `docs/api_docs/dynamic/dynamic_cracked.md`

- **Kind:** documentation
- **Size:** 2550 bytes, 57 lines
- **Summary:** Documentation page: Dynamic: dynamic_cracked.
- **Details:** -

#### `docs/api_docs/dynamic/dynamic_social.md`

- **Kind:** documentation
- **Size:** 3876 bytes, 89 lines
- **Summary:** Documentation page: Dynamic: dynamic_social.
- **Details:** -

#### `docs/api_docs/dynamic/dynamic_software.md`

- **Kind:** documentation
- **Size:** 2040 bytes, 75 lines
- **Summary:** Documentation page: Dynamic: software_scan.
- **Details:** -

#### `docs/api_docs/dynamic/dynamic_user_email.md`

- **Kind:** documentation
- **Size:** 3765 bytes, 92 lines
- **Summary:** Documentation page: Dynamic: dynamic_user_email.
- **Details:** -

#### `docs/api_docs/dynamic/dynamin_national_identity.md`

- **Kind:** documentation
- **Size:** 3868 bytes, 152 lines
- **Summary:** Documentation page: Dynamic: dynamin_national_identity.
- **Details:** -

#### `docs/api_docs/dynamic/geo_camera.md`

- **Kind:** documentation
- **Size:** 8446 bytes, 291 lines
- **Summary:** Documentation page: Dynamic: geo_iot_detect.
- **Details:** -

#### `docs/api_docs/dynamic/geo_camera_ranges.md`

- **Kind:** documentation
- **Size:** 7974 bytes, 275 lines
- **Summary:** Documentation page: Dynamic: geo_camera_ranges.
- **Details:** routes: /geo/iot_detect, /8, /24

#### `docs/api_docs/dynamic/ioc_extract.md`

- **Kind:** documentation
- **Size:** 1468 bytes, 54 lines
- **Summary:** Documentation page: Dynamic: dynamic_ioc_extract.
- **Details:** -

#### `docs/api_docs/dynamic/ip_resolve.md`

- **Kind:** documentation
- **Size:** 2922 bytes, 143 lines
- **Summary:** Documentation page: Dynamic: ip_resolve.
- **Details:** -

#### `docs/api_docs/dynamic/onion_search.md`

- **Kind:** documentation
- **Size:** 1403 bytes, 59 lines
- **Summary:** Documentation page: Dynamic: dynamic_cross_search.
- **Details:** -

#### `docs/api_docs/dynamic/wanted_scan.md`

- **Kind:** documentation
- **Size:** 3292 bytes, 95 lines
- **Summary:** Documentation page: Dynamic: wanted_scanner.
- **Details:** -

#### `docs/api_docs/reports/breach.md`

- **Kind:** documentation
- **Size:** 4764 bytes, 106 lines
- **Summary:** Documentation page: Report: breach.
- **Details:** routes: /api/search/breach/screenshot/{m_screenshot}; api: /api/search/breach/screenshot/{m_screenshot}

#### `docs/api_docs/reports/breach_screenshot.md`

- **Kind:** documentation
- **Size:** 776 bytes, 19 lines
- **Summary:** Documentation page: Report: breach_screenshot.
- **Details:** -

#### `docs/api_docs/reports/chat.md`

- **Kind:** documentation
- **Size:** 8021 bytes, 135 lines
- **Summary:** Documentation page: Report: chat.
- **Details:** -

#### `docs/api_docs/reports/defacement.md`

- **Kind:** documentation
- **Size:** 5513 bytes, 131 lines
- **Summary:** Documentation page: Report: defacement.
- **Details:** -

#### `docs/api_docs/reports/exploit.md`

- **Kind:** documentation
- **Size:** 4812 bytes, 108 lines
- **Summary:** Documentation page: Report: exploit.
- **Details:** -

#### `docs/api_docs/reports/news.md`

- **Kind:** documentation
- **Size:** 12930 bytes, 101 lines
- **Summary:** Documentation page: Report: news.
- **Details:** -

#### `docs/api_docs/reports/social.md`

- **Kind:** documentation
- **Size:** 5119 bytes, 114 lines
- **Summary:** Documentation page: Report: social.
- **Details:** -

#### `docs/api_docs/reports/stix.md`

- **Kind:** documentation
- **Size:** 4972 bytes, 144 lines
- **Summary:** Documentation page: Report: stix.
- **Details:** -

#### `docs/api_docs/reports/strategic.md`

- **Kind:** documentation
- **Size:** 5961 bytes, 119 lines
- **Summary:** Documentation page: Report: strategic.
- **Details:** -

#### `docs/api_docs/search/breach.md`

- **Kind:** documentation
- **Size:** 9605 bytes, 180 lines
- **Summary:** Documentation page: Search: breach.
- **Details:** -

#### `docs/api_docs/search/consolidated.md`

- **Kind:** documentation
- **Size:** 3929 bytes, 119 lines
- **Summary:** Documentation page: Search: consolidated.
- **Details:** -

#### `docs/api_docs/search/consolidated_ranked.md`

- **Kind:** documentation
- **Size:** 3566 bytes, 102 lines
- **Summary:** Documentation page: Search: consolidated_ranked.
- **Details:** -

#### `docs/api_docs/search/defacement.md`

- **Kind:** documentation
- **Size:** 5996 bytes, 144 lines
- **Summary:** Documentation page: Search: defacement.
- **Details:** routes: /api/search/defacement; api: /api/search/defacement

#### `docs/api_docs/search/exploit.md`

- **Kind:** documentation
- **Size:** 4412 bytes, 93 lines
- **Summary:** Documentation page: Search: exploit.
- **Details:** -

#### `docs/api_docs/search/social.md`

- **Kind:** documentation
- **Size:** 5256 bytes, 99 lines
- **Summary:** Documentation page: Search: social.
- **Details:** -

#### `docs/api_docs/search/stealerlogs.md`

- **Kind:** documentation
- **Size:** 4210 bytes, 107 lines
- **Summary:** Documentation page: Search: stealerlogs.
- **Details:** -

#### `docs/api_docs/search/strategic.md`

- **Kind:** documentation
- **Size:** 6812 bytes, 129 lines
- **Summary:** Documentation page: Search: strategic.
- **Details:** -

#### `docs/api_docs/search/telegram.md`

- **Kind:** documentation
- **Size:** 4359 bytes, 108 lines
- **Summary:** Documentation page: Search: telegram.
- **Details:** -

#### `docs/api_docs/social/profile_ followers.md`

- **Kind:** documentation
- **Size:** 1558 bytes, 52 lines
- **Summary:** Documentation page: Socail: profile_followers.
- **Details:** -

#### `docs/api_docs/social/profile_ following.md`

- **Kind:** documentation
- **Size:** 1657 bytes, 53 lines
- **Summary:** Documentation page: Socail: profile_following.
- **Details:** -

#### `docs/api_docs/social/profile_global_presence.md`

- **Kind:** documentation
- **Size:** 2237 bytes, 59 lines
- **Summary:** Documentation page: Socail: profile_global_presence.
- **Details:** -

#### `docs/api_docs/social/profile_images.md`

- **Kind:** documentation
- **Size:** 1986 bytes, 54 lines
- **Summary:** Documentation page: Socail: profile_images.
- **Details:** -

#### `docs/api_docs/social/profile_metadata.md`

- **Kind:** documentation
- **Size:** 2249 bytes, 60 lines
- **Summary:** Documentation page: Social: profile_metadata.
- **Details:** -

#### `docs/api_docs/social/profile_posts.md`

- **Kind:** documentation
- **Size:** 2443 bytes, 67 lines
- **Summary:** Documentation page: Socail: profile_posts.
- **Details:** -

#### `docs/api_docs/social/profile_search.md`

- **Kind:** documentation
- **Size:** 1878 bytes, 58 lines
- **Summary:** Documentation page: Socail: profile_search.
- **Details:** -

#### `docs/api_docs/social/recon_image_search.md`

- **Kind:** documentation
- **Size:** 2334 bytes, 55 lines
- **Summary:** Documentation page: Socail: recon_image_search.
- **Details:** -

#### `docs/api_docs/source_docs.py`

- **Kind:** backend python
- **Size:** 158612 bytes, 2488 lines
- **Summary:** Python source module.
- **Details:** -

#### `docs/api_docs/support/dns_scan.md`

- **Kind:** documentation
- **Size:** 792 bytes, 35 lines
- **Summary:** Documentation page: Dynamic: dns_scan.
- **Details:** -

#### `docs/api_docs/support/subdomain_scan.md`

- **Kind:** documentation
- **Size:** 1193 bytes, 49 lines
- **Summary:** Documentation page: Dynamic: subdomain_scan.
- **Details:** -

#### `docs/api_docs/support/wayback_scan.md`

- **Kind:** documentation
- **Size:** 1161 bytes, 49 lines
- **Summary:** Documentation page: Dynamic: wayback_scan.
- **Details:** -

#### `docs/api_docs/system-info/directory.md`

- **Kind:** documentation
- **Size:** 1407 bytes, 43 lines
- **Summary:** Documentation page: System Info: directory.
- **Details:** -

#### `docs/api_docs/system-info/dumps.md`

- **Kind:** documentation
- **Size:** 1784 bytes, 46 lines
- **Summary:** Documentation page: System Info: dumps.
- **Details:** -

#### `docs/api_docs/system-info/insight.md`

- **Kind:** documentation
- **Size:** 11330 bytes, 360 lines
- **Summary:** Documentation page: System Info: insight.
- **Details:** -

#### `docs/app_docs/developer_documentation.md`

- **Kind:** documentation
- **Size:** 15769 bytes, 383 lines
- **Summary:** Documentation page: Developer Documentation.
- **Details:** routes: /srv/elasticsearch/data

#### `docs/app_docs/introduction_to_modules.md`

- **Kind:** documentation
- **Size:** 12318 bytes, 380 lines
- **Summary:** Documentation page: Introduction To Modules.
- **Details:** -

#### `docs/app_docs/introduction_to_platform.md`

- **Kind:** documentation
- **Size:** 9958 bytes, 140 lines
- **Summary:** Documentation page: Orion Platform.
- **Details:** -

#### `docs/app_docs/swagger_api_reference.md`

- **Kind:** documentation
- **Size:** 170746 bytes, 5545 lines
- **Summary:** Documentation page: Swagger API Reference.
- **Details:** routes: /docs, /openapi.json, /openapi.json, /api/index/injection, /api/dynamic/user, /api/dynamic/cracked; api: /api/index/injection, /api/dynamic/user, /api/dynamic/cracked, /api/dynamic/software, /api/urlscan/domain, /api/dynamic/social

#### `docs/app_docs/user_manual.md`

- **Kind:** documentation
- **Size:** 63160 bytes, 2170 lines
- **Summary:** Documentation page: User Manual.
- **Details:** -

#### `docs/llm_docs/application_feature_guide.md`

- **Kind:** documentation
- **Size:** 30614 bytes, 1178 lines
- **Summary:** Documentation page: Application Feature Guide.
- **Details:** routes: /dashboard, /dashboard/profile, /login, /signup, /reset, /reset/:token; api: /api/nlp/summarize/ai, /api/nlp/chat/report, /api/nexus/chat

#### `docs/llm_docs/developer_documentation.md`

- **Kind:** documentation
- **Size:** 15652 bytes, 383 lines
- **Summary:** Documentation page: Developer Documentation.
- **Details:** routes: /srv/elasticsearch/data

#### `docs/llm_docs/feature_catalog.json`

- **Kind:** json data/config
- **Size:** 34753 bytes, 661 lines
- **Summary:** JSON object with 4 top-level keys.
- **Details:** -

#### `docs/llm_docs/feature_help_knowledge_base.md`

- **Kind:** documentation
- **Size:** 41801 bytes, 1241 lines
- **Summary:** Documentation page: Feature Help Knowledge Base.
- **Details:** routes: /login, /signup, /reset, /reset/:token, /onboarding, /dashboard, /dashboard/home, /dashboard/profile/homepage, /dashboard/home, /dashboard/profile/homepage, /dashboard/consolidated/all; api: /api/nexus/analyze-text, /api/nlp/parse/ai, /api/nlp/summarize/ai, /api/nlp/chat/report, /api/nexus/chat, /api/nexus/analyze-text

#### `docs/llm_docs/introduction_to_modules.md`

- **Kind:** documentation
- **Size:** 12318 bytes, 380 lines
- **Summary:** Documentation page: Introduction To Modules.
- **Details:** -

#### `docs/llm_docs/introduction_to_platform.md`

- **Kind:** documentation
- **Size:** 9978 bytes, 140 lines
- **Summary:** Documentation page: Orion Platform.
- **Details:** -

#### `docs/llm_docs/swagger_api_reference.md`

- **Kind:** documentation
- **Size:** 170746 bytes, 5545 lines
- **Summary:** Documentation page: Swagger API Reference.
- **Details:** routes: /docs, /openapi.json, /openapi.json, /api/index/injection, /api/dynamic/user, /api/dynamic/cracked; api: /api/index/injection, /api/dynamic/user, /api/dynamic/cracked, /api/dynamic/software, /api/urlscan/domain, /api/dynamic/social

#### `docs/llm_docs/user_manual.md`

- **Kind:** documentation
- **Size:** 63160 bytes, 2170 lines
- **Summary:** Documentation page: User Manual.
- **Details:** -

#### `docs/scripts/generate_exposed_api_reference.py`

- **Kind:** backend python
- **Size:** 17230 bytes, 449 lines
- **Summary:** Defines functions load_openapi_schema, compact, md_escape, strip_response_sections, schema_ref_name.
- **Details:** functions: load_openapi_schema, compact, md_escape, strip_response_sections, schema_ref_name, resolve_ref, merged_schema, sample_string

#### `docs/scripts/generate_feature_help_knowledge_base.py`

- **Kind:** backend python
- **Size:** 7532 bytes, 185 lines
- **Summary:** Defines functions as_list, join_inline, sentence, slug, render_feature.
- **Details:** functions: as_list, join_inline, sentence, slug, render_feature, render, main

#### `docs/scripts/generate_source_reference.py`

- **Kind:** backend python
- **Size:** 42211 bytes, 1095 lines
- **Summary:** Defines classes FileDoc, EndpointDoc, ComponentDoc; functions rel, should_skip, iter_source_files, read_text, line_count.
- **Details:** classes: FileDoc, EndpointDoc, ComponentDoc; functions: rel, should_skip, iter_source_files, read_text, line_count, first_sentence, node_name, literal_string

#### `docs/scripts/postprocess_screenshots.py`

- **Kind:** backend python
- **Size:** 6294 bytes, 207 lines
- **Summary:** Defines functions load_caption_map, rounded_mask, render_border, load_font, normalize_canvas.
- **Details:** functions: load_caption_map, rounded_mask, render_border, load_font, normalize_canvas, add_label, process_image, main

#### `docs/scripts/validate_application_docs.py`

- **Kind:** backend python
- **Size:** 10109 bytes, 248 lines
- **Summary:** Defines functions fail, load_json, route_is_known, backend_route_paths, openapi_operation_count.
- **Details:** functions: fail, load_json, route_is_known, backend_route_paths, openapi_operation_count, validate_feature_catalog, validate_feature_help, validate_application_feature_guide

### `pyproject.toml`

#### `pyproject.toml`

- **Kind:** configuration
- **Size:** 2070 bytes, 59 lines
- **Summary:** Text/configuration file.
- **Details:** -

### `run.sh`

#### `run.sh`

- **Kind:** script
- **Size:** 8390 bytes, 292 lines
- **Summary:** Text/configuration file.
- **Details:** api: /api/public

