from enum import Enum


class MailSubject(str, Enum):
    VERIFICATION = "Please verify your account"
    FORGOT_PASSWORD = "Reset your password"
    PRO_SUBSCRIPTION = "Pro Subscription Request"


class MailMessage(str, Enum):
    VERIFICATION = "Click the link below to verify your email address."
    FORGOT_PASSWORD = "Click the link below to reset your password."


class MailUrlHeading(str, Enum):
    VERIFICATION = "Verification link : "
    FORGOT_PASSWORD = "Password rest link : "
    PRO_SUBSCRIPTION = "Pro subscription details : "
