export class ReportFeedbackCommentModel {
  user_id = '';
  username = '';
  tenant_id = '';
  comment = '';
  created_at = '';
  updated_at = '';

  constructor(init?: Partial<ReportFeedbackCommentModel>) {
    Object.assign(this, init);
  }
}

export class ReportFeedbackReactionModel {
  user_id = '';
  username = '';
  tenant_id = '';
  recommended = false;
  trust_state: 'trust' | 'untrust' | null = null;
  created_at = '';
  updated_at = '';

  constructor(init?: Partial<ReportFeedbackReactionModel>) {
    Object.assign(this, init);
  }
}

export class ReportFeedbackModel {
  doc_id = '';
  recommended_count = 0;
  trust_count = 0;
  untrust_count = 0;
  comments: ReportFeedbackCommentModel[] = [];
  reactions: ReportFeedbackReactionModel[] = [];
  current_user_reaction: ReportFeedbackReactionModel | null = null;
  can_react = true;
  created_at = '';
  updated_at = '';

  constructor(init?: Partial<ReportFeedbackModel>) {
    Object.assign(this, init);
    this.comments = (init?.comments ?? []).map((comment) => new ReportFeedbackCommentModel(comment));
    this.reactions = (init?.reactions ?? []).map((reaction) => new ReportFeedbackReactionModel(reaction));
    this.current_user_reaction = init?.current_user_reaction ? new ReportFeedbackReactionModel(init.current_user_reaction) : null;
  }
}
