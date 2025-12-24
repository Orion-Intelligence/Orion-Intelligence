from starlette_admin.contrib.odmantic import ModelView

from orion.services.mongo_manager.shared_model.db_system_settings import AllowedKeys


class SystemSettingsView(ModelView):
  form_include = ["key", "value"]
  form_args = {"key": {"choices": [(key, key) for key in AllowedKeys], "label": "Select Key", "required": True, }}
