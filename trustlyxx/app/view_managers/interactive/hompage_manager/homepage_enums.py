import enum


class HOMEPAGE_MODEL_COMMANDS(enum.Enum):
  M_INIT = 1


class HOMEPAGE_SESSION_COMMANDS(enum.Enum):
  M_INIT = 1


class HOMEPAGE_PARAM:
  M_SECURE_SERVICE = "pSite"


class HOMEPAGE_CALLBACK:
  M_REFERENCE = "mHomepageCallbackReference"
  M_SECURE_SERVICE_NOTICE = "mUseSecureServiceNotice"
  M_STATISTICS = "mHomepageCallbackStatistics"
