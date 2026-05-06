export interface Case {
    caseId: string;
    caseType: string;
    owner: string;
    createdDate: Date;
    modifiedDate: Date;
    status: 'open' | 'in-progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'critical';
}