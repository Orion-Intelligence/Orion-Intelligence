LICENSE_RULES = {
    "free":{
        "modules": ["general"],
        "cti_graph": False,
        "mapping": False,
        "scanning": False,
        "admin": False,
    },
    "osint_basic": {
        "modules": ["general", "breach", "exploit", "discussion", "defacement", "social", "feed", "dumps"],
        "cti_graph": False,
        "mapping": False,
        "scanning": False,
        "admin": False,
    },
    "osint_advanced": {
        "modules": ["general", "breach", "exploit", "discussion", "defacement", "social", "feed", "dumps", "stealer_logs"],
        "cti_graph": True,
        "mapping": True,
        "scanning": False,
        "admin": False,
    },
    "pentester": {
        "modules": [],
        "scanning": True,
        "cti_graph": False,
        "admin": False,
    },
    "admin": {
        "modules": [],
        "admin": True,
        "scanning": False,
        "cti_graph": False,
    },
    "enterprise": {
        "modules": "all",
        "scanning": True,
        "cti_graph": True,
        "mapping": True,
        "admin": True,
    }
}
