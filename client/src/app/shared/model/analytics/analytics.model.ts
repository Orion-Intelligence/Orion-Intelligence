export interface Analytics {
  unique_urls: number;
  total_p_document_list_length: number;
  m_documents_length: number;
  m_clearnet_links_count: number;
  active_links: number;
  inactive_links: number;
  seldom_active_links: number;

  consolidated_lists: { [key: string]: string[] };
}
