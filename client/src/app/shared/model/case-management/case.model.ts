export interface Case {
    caseId: string;
    caseType: 'Data Leak' | 'Account Takeover' | 'Fraud' | 'Malware';
    owner: string;
    createdDate: Date;
    modifiedDate: Date;
    status: 'open' | 'in-progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'critical';
    intakeSource: string;
}