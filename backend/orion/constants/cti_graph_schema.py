GRAPH_SCHEMA_VERSION = 2

CLUSTER_LABELS = {
    "general": "General",
    "leak": "Leak",
    "tracking": "Tracking",
    "news": "News",
    "defacement": "Defacement",
    "chat": "Chat",
    "exploit": "Exploit",
    "social": "Social",
    "apt": "APT",
    "malware": "Malware",
}

CLUSTER_ALIASES = {
    "telegram": "chat",
    "chats": "chat",
    "strategic": "general",
    "breach": "leak",
}

DEFAULT_CLUSTER_KEYS = tuple(CLUSTER_LABELS.keys())
DEFAULT_CLUSTER_IDS = tuple(f"cti_vertices/{key}" for key in DEFAULT_CLUSTER_KEYS)
