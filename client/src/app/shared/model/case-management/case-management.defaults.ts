import { ArtifactType, CaseArtifact, CaseEntity, CaseEntityRequest, CaseLink, CaseRequest, CaseStatus, CaseTag, CaseTask, CaseType, ClosureReason, EntityRole, EntityType, IdentifierType, IntakeSource, Priority, Severity, SocialPlatform, SourceType, TaskStatus } from './case.model';

export interface CaseOption<T extends string> {
  value: T;
  label: string;
}

export const CASE_TYPE_OPTIONS: CaseOption<CaseType>[] = [
  { value: 'data_leak', label: 'Data Leak' },
  { value: 'account_takeover', label: 'Account Takeover' },
  { value: 'phishing', label: 'Phishing' },
  { value: 'malware', label: 'Malware' },
  { value: 'fraud', label: 'Fraud' },
  { value: 'defacement', label: 'Defacement' },
  { value: 'suspicious_infrastructure', label: 'Suspicious Infrastructure' },
  { value: 'vulnerability_exposure', label: 'Vulnerability Exposure' },
  { value: 'insider_threat', label: 'Insider Threat' },
  { value: 'social_impersonation', label: 'Social Impersonation' },
  { value: 'dark_web_mention', label: 'Dark Web Mention' },
  { value: 'other', label: 'Other' }
];

export const INTAKE_SOURCE_OPTIONS: CaseOption<IntakeSource>[] = [
  { value: 'manual', label: 'Manual' },
  { value: 'soc_alert', label: 'SOC Alert' },
  { value: 'tenant_alert', label: 'Tenant Alert' },
  { value: 'siem', label: 'SIEM' },
  { value: 'email_report', label: 'Email Report' },
  { value: 'employee_report', label: 'Employee Report' },
  { value: 'customer_report', label: 'Customer Report' },
  { value: 'breach_search', label: 'Breach Search' },
  { value: 'stealer_logs', label: 'Stealer Logs' },
  { value: 'entity_api', label: 'Entity API' },
  { value: 'network_intel', label: 'Network Intel' },
  { value: 'social_intel', label: 'Social Intel' },
  { value: 'cti_graph', label: 'CTI Graph' },
  { value: 'external_intel', label: 'External Intel' },
  { value: 'other', label: 'Other' }
];

export const CASE_STATUS_OPTIONS: CaseOption<CaseStatus>[] = [
  { value: 'new', label: 'New' },
  { value: 'triaged', label: 'Triaged' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'investigating', label: 'Investigating' },
  { value: 'waiting_on_response', label: 'Waiting on Response' },
  { value: 'remediating', label: 'Remediating' },
  { value: 'review', label: 'Review' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' }
];

export const SEVERITY_OPTIONS: Severity[] = ['info', 'low', 'medium', 'high', 'critical'];
export const PRIORITY_OPTIONS: Priority[] = ['low', 'medium', 'high', 'critical'];
export const TASK_STATUS_OPTIONS: CaseOption<TaskStatus>[] = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' }
];

export const ARTIFACT_TYPE_OPTIONS: CaseOption<ArtifactType>[] = [
  { value: 'evidence', label: 'Evidence' },
  { value: 'screenshot', label: 'Screenshot' },
  { value: 'file', label: 'File' },
  { value: 'url_capture', label: 'URL Capture' },
  { value: 'raw_alert', label: 'Raw Alert' },
  { value: 'chat_transcript', label: 'Chat Transcript' },
  { value: 'email_header', label: 'Email Header' },
  { value: 'log_excerpt', label: 'Log Excerpt' },
  { value: 'report', label: 'Report' },
  { value: 'other', label: 'Other' }
];

export const CASE_TAG_OPTIONS: CaseOption<CaseTag>[] = [
  { value: 'vip', label: 'VIP' },
  { value: 'executive', label: 'Executive' },
  { value: 'watchlist', label: 'Watchlist' },
  { value: 'high_value_asset', label: 'High Value Asset' },
  { value: 'customer_impact', label: 'Customer Impact' },
  { value: 'regulatory', label: 'Regulatory' },
  { value: 'public_exposure', label: 'Public Exposure' },
  { value: 'credential_exposure', label: 'Credential Exposure' },
  { value: 'requires_review', label: 'Requires Review' },
  { value: 'escalated', label: 'Escalated' },
  { value: 'false_positive', label: 'False Positive' },
  { value: 'duplicate', label: 'Duplicate' }
];

export const ENTITY_TYPE_OPTIONS: CaseOption<EntityType>[] = [
  { value: 'person', label: 'Person' },
  { value: 'organization', label: 'Organization' },
  { value: 'email', label: 'Email' },
  { value: 'domain', label: 'Domain' },
  { value: 'ip', label: 'IP Address' },
  { value: 'url', label: 'URL' },
  { value: 'username', label: 'Username' },
  { value: 'phone', label: 'Phone' },
  { value: 'wallet', label: 'Wallet' },
  { value: 'financial_institution', label: 'Financial Institution' },
  { value: 'payment_processor', label: 'Payment Processor' },
  { value: 'bank_account', label: 'Bank Account' },
  { value: 'card', label: 'Card' },
  { value: 'iban', label: 'IBAN' },
  { value: 'swift_bic', label: 'SWIFT / BIC' },
  { value: 'merchant_account', label: 'Merchant Account' },
  { value: 'transaction', label: 'Transaction' },
  { value: 'crypto_exchange', label: 'Crypto Exchange' },
  { value: 'device', label: 'Device' },
  { value: 'cloud_asset', label: 'Cloud Asset' },
  { value: 'credential', label: 'Credential' },
  { value: 'social_profile', label: 'Social Profile' },
  { value: 'malware', label: 'Malware' },
  { value: 'vulnerability', label: 'Vulnerability' },
  { value: 'threat_actor', label: 'Threat Actor' },
  { value: 'campaign', label: 'Campaign' },
  { value: 'incident', label: 'Incident' },
  { value: 'other', label: 'Other' }
];

export const ENTITY_ROLE_OPTIONS: CaseOption<EntityRole>[] = [
  { value: 'related', label: 'Related' },
  { value: 'victim', label: 'Victim' },
  { value: 'attacker', label: 'Attacker' },
  { value: 'asset', label: 'Asset' },
  { value: 'indicator', label: 'Indicator' },
  { value: 'source', label: 'Source' },
  { value: 'recipient', label: 'Recipient' },
  { value: 'observed_on', label: 'Observed On' },
  { value: 'owner', label: 'Owner' }
];

export const SOURCE_TYPE_OPTIONS: CaseOption<SourceType>[] = [
  { value: 'manual', label: 'Manual' },
  { value: 'orion_alert', label: 'Orion Alert' },
  { value: 'orion_search', label: 'Orion Search' },
  { value: 'orion_scan', label: 'Orion Scan' },
  { value: 'import', label: 'Import' },
  { value: 'api', label: 'API' },
  { value: 'external', label: 'External' },
  { value: 'other', label: 'Other' }
];

export const SOCIAL_PLATFORM_OPTIONS: CaseOption<SocialPlatform>[] = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'x', label: 'X' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'discord', label: 'Discord' },
  { value: 'reddit', label: 'Reddit' },
  { value: 'github', label: 'GitHub' },
  { value: 'gitlab', label: 'GitLab' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'mastodon', label: 'Mastodon' },
  { value: 'pastebin', label: 'Pastebin' },
  { value: 'dark_web_forum', label: 'Dark Web Forum' },
  { value: 'other', label: 'Other' }
];

export const IDENTIFIER_TYPE_OPTIONS: CaseOption<IdentifierType>[] = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'username', label: 'Username' },
  { value: 'domain', label: 'Domain' },
  { value: 'ip', label: 'IP Address' },
  { value: 'url', label: 'URL' },
  { value: 'national_id', label: 'National ID' },
  { value: 'passport', label: 'Passport' },
  { value: 'employee_id', label: 'Employee ID' },
  { value: 'customer_id', label: 'Customer ID' },
  { value: 'bank_account_number', label: 'Bank Account Number' },
  { value: 'iban', label: 'IBAN' },
  { value: 'swift_bic', label: 'SWIFT / BIC' },
  { value: 'card_bin', label: 'Card BIN' },
  { value: 'card_last4', label: 'Card Last 4' },
  { value: 'merchant_id', label: 'Merchant ID' },
  { value: 'transaction_id', label: 'Transaction ID' },
  { value: 'device_id', label: 'Device ID' },
  { value: 'hostname', label: 'Hostname' },
  { value: 'mac_address', label: 'MAC Address' },
  { value: 'wallet_address', label: 'Wallet Address' },
  { value: 'cve', label: 'CVE' },
  { value: 'other', label: 'Other' }
];

export const DEFAULT_PRIMARY_CASE_ENTITY_TEMPLATE: CaseEntity = {
  entityId: '',
  type: 'person',
  value: '',
  entityDescription: '',
  role: 'primary',
  confidence: 1,
  source: 'manual',
  identifiers: [],
  socialProfiles: [],
  tags: [],
  entityTypeOtherValue: '',
  entitySourceOtherValue: ''
};

export const DEFAULT_RELATED_CASE_ENTITY_TEMPLATE: CaseEntity = {
  ...structuredClone(DEFAULT_PRIMARY_CASE_ENTITY_TEMPLATE),
  entityId: '',
  role: 'related',
  linkedEntityId: '',
  identifiers: [],
  socialProfiles: [],
  tags: []
};

export const DEFAULT_PRIMARY_CASE_ENTITY_REQUEST_TEMPLATE: CaseEntityRequest = {
  entityId: '',
  type: 'person',
  value: '',
  entityDescription: '',
  role: 'primary',
  confidence: 1,
  source: 'manual',
  identifiers: [],
  socialProfiles: [],
  tags: [],
  entityTypeOtherValue: '',
  entitySourceOtherValue: ''
};

export const DEFAULT_CASE_ARTIFACT_TEMPLATE: CaseArtifact = {
  artifactId: '',
  type: 'evidence',
  title: '',
  description: '',
  source: 'manual',
  url: '',
  fileName: '',
  fileType: '',
  fileSize: 0,
  fileResourceId: '',
  entityIds: [],
  tags: [],
  capturedAt: null,
  artifactTypeOtherValue: '',
  artifactSourceOtherValue: ''
};

export const DEFAULT_CASE_TASK_TEMPLATE: CaseTask = {
  taskId: '',
  title: '',
  description: '',
  status: 'open',
  priority: 'medium',
  assignedTo: '',
  dueAt: null,
  entityIds: [],
  artifactIds: []
};

export const CASE_LINK_RELATIONSHIP_OPTIONS: CaseOption<CaseLink['relationship']>[] = [
  { value: 'related', label: 'Related' },
  { value: 'duplicate', label: 'Duplicate' },
  { value: 'parent', label: 'Parent' },
  { value: 'child', label: 'Child' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'escalation', label: 'Escalation' },
  { value: 'same_actor', label: 'Same Actor' },
  { value: 'same_victim', label: 'Same Victim' },
  { value: 'same_infrastructure', label: 'Same Infrastructure' }
];

export const CLOSURE_REASON_OPTIONS: CaseOption<ClosureReason>[] = [
  { value: 'true_positive', label: 'True Positive' },
  { value: 'false_positive', label: 'False Positive' },
  { value: 'duplicate', label: 'Duplicate' },
  { value: 'risk_accepted', label: 'Risk Accepted' },
  { value: 'remediated', label: 'Remediated' },
  { value: 'no_action_required', label: 'No Action Required' },
  { value: 'inconclusive', label: 'Inconclusive' },
  { value: 'other', label: 'Other' }
];

export const DEFAULT_CASE_REQUEST_TEMPLATE: CaseRequest = {
  caseId: '',
  title: '',
  description: '',
  caseType: 'data_leak',
  status: 'new',
  severity: 'low',
  priority: 'low',
  intakeSource: 'manual',
  tags: [],
  primaryEntityId: '',
  assignedAnalystIds: [],
  artifacts: [],
  entities: [],
  comments: [],
  tasks: [],
  linkedCases: [],
  caseTypeOtherValue: '',
  intakeSourceOtherValue: ''
};
