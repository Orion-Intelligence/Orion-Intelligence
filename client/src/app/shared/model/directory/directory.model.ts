export interface DirectoryCallbackModel {
    total_count: number;
    page: number;
    mDirectoryCallbackLinks: DocumentModel[];
}
export interface DocumentModel {
    url: string;
    content_type: string[];
    index_type: string[];
    leak_model_last_update?: string;
    geneic_model_last_update?: string;
    network_type?: string;
    name?: string;
}
