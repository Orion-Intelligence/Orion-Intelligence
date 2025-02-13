from enum import Enum

class ErrorCodes(Enum):
    SUCCESS = 0
    DOCUMENT_NOT_FOUND = 1001
    VALIDATION_ERROR = 1002
    DATABASE_ERROR = 1003
    UNKNOWN_ERROR = 9999
