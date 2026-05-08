export interface SocialMediaProfile {
    platform: string;
    username: string;
}

export interface AdditionalIdentifier {
    type: string;
    value: string;
}

export interface RelatedEntity {
    name: string;
    socialMediaProfiles: SocialMediaProfile[];
    webUrls: string[];
    emails: string[];
    phoneNumbers: string[];
    additionalIdentifiers: AdditionalIdentifier[];
}

export interface Case {
    caseId: string;
    caseType: 'Data Leak' | 'Account Takeover' | 'Fraud' | 'Malware';
    owner: string;
    createdDate: Date;
    modifiedDate: Date;
    status: 'open' | 'in-progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'critical';
    intakeSource: string;
    entityName: string;
    socialMediaProfiles: SocialMediaProfile[];
    webUrls: string[];
    emails: string[];
    phoneNumbers: string[];
    additionalIdentifiers: AdditionalIdentifier[];
    relatedEntities: RelatedEntity[];
    linkedCaseId?: string;
    linkedReason?: string;
    linkedCases?: string[];
}