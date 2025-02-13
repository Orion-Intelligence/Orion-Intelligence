import enum

class ERROR_MODEL_CALLBACK(enum.Enum):
  M_INIT = 1

class ERROR_MESSAGE_CALLBACK:
  M_ERROR_400 = "This page isn't working at the moment"
  M_ERROR_403 = "You don't have permission to access this resource"
  M_ERROR_500 = "We are currently unable to handle this request"
  M_ERROR_404 = "The requested URL was not found on this server"
