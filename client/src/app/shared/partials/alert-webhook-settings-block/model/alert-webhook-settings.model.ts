export interface AlertWebhookSettingsForm {
  slack_client_id: string;
  slack_client_secret: string;
  slack_configured: boolean;
  jira_client_id: string;
  jira_client_secret: string;
  jira_configured: boolean;
  alert_slack_connected: boolean;
  alert_slack_channel: string;
  alert_slack_team: string;
  alert_jira_connected: boolean;
  alert_jira_site_url: string;
  alert_jira_site_name: string;
}

export interface AlertConnectorSettingsResponse {
  app: {
    slack_client_id: string;
    slack_configured: boolean;
    jira_client_id: string;
    jira_configured: boolean;
  };
  tenant: {
    slack_connected: boolean;
    slack_channel: string;
    slack_team: string;
    jira_connected: boolean;
    jira_site_url: string;
    jira_site_name: string;
  };
}
