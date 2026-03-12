from enum import Enum


class MailSubject(str, Enum):
    VERIFICATION = "Please verify your account"
    FORGOT_PASSWORD = "Reset your password"
    PRO_SUBSCRIPTION = "Pro Subscription Request"
    SUPPORT = "Support Request Received"
    ACCOUNT_CREATED = "Welcome to Our Platform"


class MailMessage(str, Enum):
    VERIFICATION = "Click the link below to verify your email address."
    FORGOT_PASSWORD = "Click the link below to reset your password."
    ACCOUNT_CREATED = "Your account has been successfully created. Please verify your email to activate your account."


class MailUrlHeading(str, Enum):
    VERIFICATION = "Verification link : "
    FORGOT_PASSWORD = "Password rest link : "
    PRO_SUBSCRIPTION = "Pro subscription details : "
    SUPPORT = "Message : "
    ACCOUNT_CREATED = "Verify your account : "
