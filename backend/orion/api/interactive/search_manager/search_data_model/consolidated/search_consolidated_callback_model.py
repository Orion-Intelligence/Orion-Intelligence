from pydantic import BaseModel
from typing import Optional

from orion.api.interactive.search_manager.search_data_model.chat.search_chat_callback_model import search_chat_callback_model
from orion.api.interactive.search_manager.search_data_model.dump.search_stealerlog_callback_model import search_stealerlog_callback_model
from orion.api.interactive.search_manager.search_data_model.exploit.search_exploit_callback_model import search_exploit_callback_model
from orion.api.interactive.search_manager.search_data_model.general.search_general_callback_model import search_general_callback_model
from orion.api.interactive.search_manager.search_data_model.leak.search_leak_callback_model import search_leak_callback_model
from orion.api.interactive.search_manager.search_data_model.defacement.search_defacement_callback_model import search_defacement_callback_model
from orion.api.interactive.search_manager.search_data_model.social.search_social_callback_model import search_social_callback_model


class grouped_consolidated_search_callback_model(BaseModel):
    leak_model: Optional[search_leak_callback_model] = None
    exploit_model: Optional[search_exploit_callback_model] = None
    chat_model: Optional[search_chat_callback_model] = None
    generic_model: Optional[search_general_callback_model] = None
    defacement_model: Optional[search_defacement_callback_model] = None
    social_model: Optional[search_social_callback_model] = None
    stealer_model: Optional[search_stealerlog_callback_model] = None

    tracking_model:Optional[search_leak_callback_model]=None
    news_model:Optional[search_leak_callback_model]=None
