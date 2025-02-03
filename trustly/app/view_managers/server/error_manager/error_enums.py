import enum


class ERROR_MODEL_CALLBACK(enum.Enum):
  M_INIT = 1


class ERROR_PARAM:
  M_SECURE_SERVICE = "pSite"


class ERROR_CALLBACK:
  M_SECURE_SERVICE_NOTICE = "mUseSecureServiceNotice"
  M_ERROR_CODE = "mErrorCode"
  M_ERROR_MESSAGE = "mErrorMessage"


class ERROR_MESSAGE_CALLBACK:
  M_ERROR_400 = "This page isn't working at the moment"
  M_ERROR_403 = "You don't have permission to access this resource"
  M_ERROR_500 = "We are currently unable to handle this request"
  M_ERROR_404 = "The requested URL was not found on this server"
