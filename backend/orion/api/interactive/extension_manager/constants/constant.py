BUS_CHANNEL = "orion_ext_socket_bus"

SOCKET_KEY = "orion:ext:sock"
INFLIGHT_KEY = "orion:ext:inflight"
RESULT_KEY = "orion:ext:result"
REQUEST_KEY = "orion:ext:req"
SCOPE_REQUEST_KEY = "orion:ext:screq"
ACK_KEY = "orion:ext:ack"

SOCKET_TTL_SECONDS = 20
INFLIGHT_TTL_SECONDS = 90
RESULT_TTL_SECONDS = 300

RESPONSE_TIMEOUT_SECONDS = 15
COMPLETION_TIMEOUT_SECONDS = INFLIGHT_TTL_SECONDS

EXTENSION_TIMEOUT_ERROR = "extension_timeout"
