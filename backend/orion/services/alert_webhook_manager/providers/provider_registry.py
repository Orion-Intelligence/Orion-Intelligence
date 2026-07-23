from orion.services.alert_webhook_manager.providers.jira import JiraConnector
from orion.services.alert_webhook_manager.providers.slack import SlackConnector
from orion.services.mongo_manager.shared_model.db_alert_connector_model import AlertConnectorProvider


ALERT_CONNECTOR_PROVIDERS = {
    AlertConnectorProvider.SLACK: SlackConnector(),
    AlertConnectorProvider.JIRA: JiraConnector(),
}
