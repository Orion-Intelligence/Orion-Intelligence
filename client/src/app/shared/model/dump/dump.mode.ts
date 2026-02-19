export interface DumpCallbackLink {
    leak_url: string;
    source: string;
    group: string;
    link: string;
    parsed_status: boolean;
    created_at: string;
}
export interface DumpCallbackModel {
    total_count: number;
    page: number;
    mDumpCallbackLinks: DumpCallbackLink[];
}
