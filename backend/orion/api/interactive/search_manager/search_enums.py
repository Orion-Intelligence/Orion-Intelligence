from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX

SEARCH_CONFIG = {

    "leak_model": {
        "base_index": [ELASTIC_INDEX.S_LEAK_INDEX],
        "allowed_categories": ["leaks","tracking"],
        "blocked_categories": ["news"]
    },

    "tracking_model": {
        "base_index": [ELASTIC_INDEX.S_LEAK_INDEX],
        "allowed_categories": ["tracking"],
        "blocked_categories": []
    },

    "news_model": {
        "base_index": [ELASTIC_INDEX.S_LEAK_INDEX],
        "allowed_categories": ["news"],
        "blocked_categories": []
    },

    "generic_model": {
        "base_index": [ELASTIC_INDEX.S_GENERIC_INDEX],
        "allowed_categories": [],
        "blocked_categories": []
    },

    "exploit_model": {
        "base_index": [ELASTIC_INDEX.S_EXPLOIT_INDEX],
        "allowed_categories": [],
        "blocked_categories": []
    },

    "chat_model": {
        "base_index": [ELASTIC_INDEX.S_CHATS_INDEX],
        "allowed_categories": [],
        "blocked_categories": []
    },

    "social_model": {
        "base_index": [ELASTIC_INDEX.S_SOCIAL_INDEX],
        "allowed_categories": [],
        "blocked_categories": []
    },

    "defacement_model": {
        "base_index": [ELASTIC_INDEX.S_DEFACEMENT_INDEX],
        "allowed_categories": [],
        "blocked_categories": []
    }
}