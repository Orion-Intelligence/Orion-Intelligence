from enum import Enum

class MailSubject(str, Enum):
    VERIFICATION = "Please verify your account"
    FORGOT_PASSWORD = "Reset your password"


class MailMessage(str, Enum):
    VERIFICATION = "Click the link below to verify your email address."
    FORGOT_PASSWORD = "Click the link below to reset your password."