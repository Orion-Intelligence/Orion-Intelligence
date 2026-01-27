export interface IocItem {
  [key: string]: string;
}

export interface IocExtractionResult {
  filename: string;
  file_type: string;
  extracted_text_length: number;
  iocs: IocItem[];
  status: string;
  original_filename: string;
  progress?: number;
  step?: string;
}

export interface IocExtractResponse {
  result: IocExtractionResult;
  status?: string;
  progress?: number;
  step?: string;
}

export interface GroupedIoc {
  name: string;
  total: number;
  items: { type: string; value: string; display: string; description: string }[];
}
