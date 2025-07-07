from pydantic import BaseModel
from typing import Optional

from orion.api.interactive.search_manager.search_data_model.chat.search_chat_callback_model import \
    search_chat_callback_model
from orion.api.interactive.search_manager.search_data_model.exploit.search_exploit_callback_model import \
    search_exploit_callback_model
from orion.api.interactive.search_manager.search_data_model.general.search_general_callback_model import \
    search_general_callback_model
from orion.api.interactive.search_manager.search_data_model.leak.search_leak_callback_model import \
    search_leak_callback_model
from orion.api.interactive.search_manager.search_data_model.defacement.search_defacement_callback_model import \
    search_defacement_callback_model


class grouped_consolidated_search_callback_model(BaseModel):
    leak_model: Optional[search_leak_callback_model]
    exploit_model: Optional[search_exploit_callback_model]
    chat_model: Optional[search_chat_callback_model]
    generic_model: Optional[search_general_callback_model]
    defacement_model: Optional[search_defacement_callback_model]
