export interface PublicUserData {
  hidden: boolean;
  message?: string;
  username: string;
  email: string;
  role: string;
  tenant_name: string;
  licenses: string[];
}

export interface PublicUserActivityItem {
  doc_id: string;
  title: string;
  preview: string;
  report_date: string;
  route_path: string;
  route_query: Record<string, string>;
  index_name: string;
  recommended: boolean;
  trust_state: string | null;
  comments_count: number;
  latest_reaction_at: string;
  latest_comment_at: string;
  latest_activity_at: string;
}

export interface PublicUserActivityResponse {
  profile: PublicUserData;
  activity: PublicUserActivityItem[];
}
