from enum import Enum


class MailSubject(str, Enum):
    VERIFICATION = "Please verify your account"
    ACCOUNT_RECOVERY = "Reset your account access"
    PRO_SUBSCRIPTION = "Pro Subscription Request"
    SUPPORT = "Support Request Received"
    ACCOUNT_CREATED = "Welcome to Our Platform"


class MailMessage(str, Enum):
    VERIFICATION = "Click the link below to verify your email address."
    ACCOUNT_RECOVERY = "Click the link below to reset your account access."
    ACCOUNT_CREATED = "Your account has been successfully created. Please verify your email to activate your account."


class MailUrlHeading(str, Enum):
    VERIFICATION = "Verification link : "
    ACCOUNT_RECOVERY = "Reset link : "
    PRO_SUBSCRIPTION = "Pro subscription details : "
    SUPPORT = "Message : "
    ACCOUNT_CREATED = "Verify your account : "


class AlertMailSubject(str, Enum):
    SCAN_COMPLETED = "Alert scan completed - {count} new {alert_word} found"
    CUSTOM_CREATED = "Custom Alert Created"
    ALERT_UPDATED = "Alert Updated"


class AlertMailTitle(str, Enum):
    SCAN_COMPLETED = "Alert Scan Completed"
    CUSTOM_CREATED = "Custom Alert Created"
    ALERT_UPDATED = "Alert Updated"


class AlertMailMessage(str, Enum):
    SCAN_COMPLETED = "Your alert scan has finished. We found {count} new {alert_word} across your monitored IOC values."
    CUSTOM_CREATED = "A custom alert has been created for your workspace."
    ALERT_UPDATED = "An alert in your workspace has been updated with the latest details."
    DEFAULT_CLOSING = "Please review these alerts when you have a moment. The alert view contains the full context, source details, and IOC history."
    ALERT_CHANGE_CLOSING = "You can open the alert view to review the latest IOC, source, and category details."
    MODULE_COUNT = "In {category}, we found {count} new {alert_word}"
    SINGLE_ALERT_COUNT = "In {category}, we found 1 alert"


class AlertMailLabel(str, Enum):
    ACTION_LABEL = "View Alerts"
    CREATED_STATUS = "Created"
    UPDATED_STATUS = "Updated"
    NO_IOC_MATCH = "No IOC match"
    IOC_FALLBACK = "IOC"
    UNCATEGORIZED = "Uncategorized"
