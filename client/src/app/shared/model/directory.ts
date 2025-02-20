export interface DocumentModel {
  _id: string;
  url: string;
  content_type: string[];
  index: string;
  leak_status_date: number;
  network_type: string;
  url_status_date: number;
}

export interface DirectoryApiCallbackModel {
  documents: DocumentModel[];
  count: number;
  content_type_parameter: string;
  index_parameter: string;
}
