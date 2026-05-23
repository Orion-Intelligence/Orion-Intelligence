export type CaseType =
    'data_leak' |
    'account_takeover' |
    'phishing' |
    'malware' |
    'fraud' |
    'defacement' |
    'suspicious_infrastructure' |
    'vulnerability_exposure' |
    'insider_threat' |
    'social_impersonation' |
    'dark_web_mention' |
    'other';

export type CaseStatus =
    'new' |
    'triaged' |
    'assigned' |
    'investigating' |
    'waiting_on_response' |
    'remediating' |
    'review' |
    'resolved' |
    'closed';

export type EntityConfidence = 'low' | 'medium' | 'high';
export type Severity = 'info' | 'low' | 'medium' | 'high' | 'critical';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'open' | 'in_progress' | 'blocked' | 'done' | 'cancelled';
export type ArtifactType = 'evidence' | 'screenshot' | 'file' | 'url_capture' | 'raw_alert' | 'chat_transcript' | 'email_header' | 'log_excerpt' | 'report' | 'other';
export type ClosureReason = 'true_positive' | 'false_positive' | 'duplicate' | 'risk_accepted' | 'remediated' | 'no_action_required' | 'inconclusive' | 'other';

export type IntakeSource =
    'manual' |
    'soc_alert' |
    'tenant_alert' |
    'siem' |
    'email_report' |
    'employee_report' |
    'customer_report' |
    'breach_search' |
    'stealer_logs' |
    'entity_api' |
    'network_intel' |
    'social_intel' |
    'cti_graph' |
    'external_intel' |
    'other';

export type EntityType =
    'person' |
    'organization' |
    'email' |
    'domain' |
    'ip' |
    'url' |
    'username' |
    'phone' |
    'wallet' |
    'financial_institution' |
    'payment_processor' |
    'bank_account' |
    'card' |
    'iban' |
    'swift_bic' |
    'merchant_account' |
    'transaction' |
    'crypto_exchange' |
    'device' |
    'cloud_asset' |
    'credential' |
    'social_profile' |
    'malware' |
    'vulnerability' |
    'threat_actor' |
    'campaign' |
    'incident' |
    'other';

export type EntityRole =
    'primary' |
    'related' |
    'victim' |
    'attacker' |
    'asset' |
    'indicator' |
    'source' |
    'recipient' |
    'observed_on' |
    'owner';

export type EntityRelationship =
    'subject_of_case' |
    'affected_account' |
    'affected_asset' |
    'contact_point' |
    'owns' |
    'uses' |
    'hosts' |
    'resolves_to' |
    'connected_to' |
    'created_by' |
    'targeted_by' |
    'observed_with' |
    'same_as' |
    'related_to';

export type SourceType = 'manual' | 'orion_alert' | 'orion_search' | 'orion_scan' | 'import' | 'api' | 'external' | 'other';

export type SocialPlatform =
    'facebook' |
    'instagram' |
    'x' |
    'linkedin' |
    'telegram' |
    'whatsapp' |
    'discord' |
    'reddit' |
    'github' |
    'gitlab' |
    'tiktok' |
    'youtube' |
    'mastodon' |
    'pastebin' |
    'dark_web_forum' |
    'other';

export type IdentifierType =
    'email' |
    'phone' |
    'username' |
    'domain' |
    'ip' |
    'url' |
    'national_id' |
    'passport' |
    'employee_id' |
    'customer_id' |
    'bank_account_number' |
    'iban' |
    'swift_bic' |
    'card_bin' |
    'card_last4' |
    'merchant_id' |
    'transaction_id' |
    'device_id' |
    'hostname' |
    'mac_address' |
    'wallet_address' |
    'cve' |
    'other';

export type CaseTag =
    'vip' |
    'executive' |
    'watchlist' |
    'high_value_asset' |
    'customer_impact' |
    'regulatory' |
    'public_exposure' |
    'credential_exposure' |
    'requires_review' |
    'escalated' |
    'false_positive' |
    'duplicate';

export interface SocialMediaProfile {
    platform: SocialPlatform | '';
    username: string;
    profileUrl?: string;
    displayName?: string;
    platformOtherValue?: string;
}

export interface AdditionalIdentifier {
    type: IdentifierType | '';
    value: string;
    issuer?: string;
    verified?: boolean;
    identifierTypeOtherValue?: string;
}

export interface CaseEntity {
    entityId: string;
    type: EntityType;
    value: string;
    entityTypeOtherValue?: string;
    entitySourceOtherValue?: string;
    entityDescription?: string;
    role: EntityRole;
    confidence: EntityConfidence;
    source: SourceType;
    identifiers: AdditionalIdentifier[];
    socialProfiles: SocialMediaProfile[];
    tags: CaseTag[];
    linkedEntityId?: string;
    createdBy?: string;
    updatedBy?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
}

export interface CaseEntityRequest {
    entityId: string;
    type: EntityType;
    value: string;
    entityTypeOtherValue?: string;
    entitySourceOtherValue?: string;
    entityDescription?: string;
    role: EntityRole;
    confidence: EntityConfidence;
    source: SourceType;
    identifiers: AdditionalIdentifier[];
    socialProfiles: SocialMediaProfile[];
    tags: CaseTag[];
    linkedEntityId?: string;
}

export interface CaseLink {
    targetCaseId: string;
    relationship:
    'duplicate' |
    'related' |
    'parent' |
    'child' |
    'follow_up' |
    'escalation' |
    'same_actor' |
    'same_victim' |
    'same_infrastructure';
    reason: string;
    createdBy?: string;
    createdAt?: Date | string;
}

export interface CaseLinkRequest {
    targetCaseId: string;
    relationship:
    'duplicate' |
    'related' |
    'parent' |
    'child' |
    'follow_up' |
    'escalation' |
    'same_actor' |
    'same_victim' |
    'same_infrastructure';
    reason: string;
}

export interface CaseArtifact {
    artifactId: string;
    type: ArtifactType;
    title: string;
    description?: string;
    source: SourceType;
    artifactTypeOtherValue?: string;
    artifactSourceOtherValue?: string;
    url?: string;
    fileName?: string;
    fileType?: string;
    fileSize?: number;
    fileResourceId?: string;
    entityIds: string[];
    tags: CaseTag[];
    capturedAt?: Date | string | null;
    createdBy?: string;
    createdAt?: Date | string;
}

export interface CaseArtifactRequest {
    artifactId: string;
    type: ArtifactType;
    title: string;
    description?: string;
    source: SourceType;
    artifactTypeOtherValue?: string;
    artifactSourceOtherValue?: string;
    url?: string;
    fileName?: string;
    fileType?: string;
    fileSize?: number;
    fileResourceId?: string;
    entityIds: string[];
    tags: CaseTag[];
    capturedAt?: Date | string | null;
}

export interface CaseTask {
    taskId: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: Priority;
    assignedTo?: string;
    dueAt?: Date | string | null;
    entityIds: string[];
    artifactIds: string[];
    createdBy?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    completedAt?: Date | string | null;
}

export interface CaseTaskRequest {
    taskId: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: Priority;
    assignedTo?: string;
    dueAt?: Date | string | null;
    entityIds: string[];
    artifactIds: string[];
}

export interface CaseComment {
    commentId: string;
    body: string;
    entityIds: string[];
    artifactIds: string[];
    createdBy?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
}

export interface CaseCommentRequest {
    commentId: string;
    body: string;
    entityIds: string[];
    artifactIds: string[];
}

export interface CaseAnalyst {
    id: string;
    username?: string;
    email?: string;
    role?: string;
    status?: string;
}

export interface CaseClosure {
    closureReasonOtherValue?: string;
    reason: ClosureReason;
    summary?: string;
    resolution?: string;
    closedBy?: string;
    closedAt?: Date | string;
}

export interface CaseClosureRequest {
    closureReasonOtherValue?: string;
    reason: ClosureReason;
    summary?: string;
    resolution?: string;
}

export interface CaseRequest {
    caseId: string;
    caseTypeOtherValue?: string;
    intakeSourceOtherValue?: string;
    title: string;
    description: string;
    caseType: CaseType;
    status: CaseStatus;
    severity: Severity;
    priority: Priority;
    intakeSource: IntakeSource;
    tags: CaseTag[];
    primaryEntityId: string;
    assignedAnalystIds: string[];
    artifacts: CaseArtifactRequest[];
    entities: CaseEntityRequest[];
    comments: CaseCommentRequest[];
    tasks: CaseTaskRequest[];
    linkedCases: CaseLinkRequest[];
    closure?: CaseClosureRequest | null;
}

export interface CaseUpdateRequest {
    title: string;
    caseTypeOtherValue?: string;
    intakeSourceOtherValue?: string;
    description: string;
    caseType: CaseType;
    status: CaseStatus;
    severity: Severity;
    priority: Priority;
    intakeSource: IntakeSource;
    tags: CaseTag[];
    primaryEntityId: string;
    assignedAnalystIds: string[];
    artifacts: CaseArtifactRequest[];
    entities: CaseEntityRequest[];
    tasks: CaseTaskRequest[];
    comments?: CaseCommentRequest[];
    linkedCases: CaseLinkRequest[];
    closure?: CaseClosureRequest | null;
}

export interface CaseShareRequest {
    expiresInHours?: number;
}

export interface CaseShareResponse {
    token: string;
    path: string;
    expiresAt: Date | string;
}

export interface SharedCaseArtifact {
    artifactTypeOtherValue?: string;
    artifactSourceOtherValue?: string;
    artifactId: string;
    type: string;
    title: string;
    description?: string;
    source?: string;
    url?: string;
    fileName?: string;
    fileType?: string;
    tags?: string[];
    capturedAt?: string;
}

export interface SharedSocialProfile {
    platformOtherValue?: string;
    platform: string;
    username: string;
    profileUrl?: string;
    displayName?: string;
}

export interface SharedIdentifier {
    identifierTypeOtherValue?: string;
    type: string;
    value: string;
    issuer?: string;
    verified?: boolean;
}

export interface SharedCaseEntity {
    entityTypeOtherValue?: string;
    entitySourceOtherValue?: string;
    entityId: string;
    type: string;
    value: string;
    entityDescription?: string;
    role?: string;
    relationshipToCase?: string;
    confidence?: EntityConfidence;
    source?: string;
    identifiers?: SharedIdentifier[];
    socialProfiles?: SharedSocialProfile[];
    tags?: string[];
    createdBy?: string;
    updatedBy?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface SharedCaseTask {
    taskId: string;
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    assignedTo?: string;
    dueAt?: string;
    createdAt?: string;
    updatedAt?: string;
    completedAt?: string;
}

export interface SharedCaseLink {
    targetCaseId: string;
    relationship?: string;
    reason?: string;
    createdBy?: string;
    createdAt?: string;
}

export interface SharedCaseClosure {
    closureReasonOtherValue?: string;
    reason: string;
    summary?: string;
    resolution?: string;
    closedAt?: string;
}

export interface SharedCaseReport {
    otherValue?: string;
    shareId: string;
    caseId: string;
    title: string;
    description?: string;
    caseType: string;
    status: string;
    severity: string;
    priority: string;
    tags?: string[];
    createdAt?: string;
    updatedAt?: string;
    expiresAt?: string;
    primaryEntityId?: string | null;
    entities?: SharedCaseEntity[];
    closure?: SharedCaseClosure | null;
    closedAt?: string;
    artifacts?: SharedCaseArtifact[];
    tasks?: SharedCaseTask[];
    linkedCases?: SharedCaseLink[];
}

export interface Case {
    id?: string;
    caseId: string;
    caseTypeOtherValue?: string;
    intakeSourceOtherValue?: string;
    tenant_uuid?: string;
    title: string;
    description: string;
    caseType: CaseType;
    status: CaseStatus;
    severity: Severity;
    priority: Priority;
    intakeSource: IntakeSource;
    tags: CaseTag[];
    createdBy?: string;
    assignedAnalystIds: string[];
    primaryEntityId?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    closedAt?: Date | string | null;
    artifacts: CaseArtifact[];
    entities: CaseEntity[];
    comments: CaseComment[];
    tasks: CaseTask[];
    linkedCases: CaseLink[];
    closure?: CaseClosure | null;
}
