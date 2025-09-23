import { Suggestion } from "../shared/common-result";

export class StealerLogResultItem {
  type?: string;
  raw?: string;
  channel?: string;
  filename?: string;
  log_hash?: string;
  timestamp?: string;
  [key: string]: any;

  constructor(init?: Partial<StealerLogResultItem>) {
    Object.assign(this, init);
  }
}

export class StealerLogCallbackModel {
  Result: StealerLogResultItem[] = [];
  Page_Count: number = 0;
  Suggestions: Suggestion[] = [];

  constructor(init?: Partial<StealerLogCallbackModel>) {
    if (init) {
      this.Result = init.Result?.map(r => new StealerLogResultItem(r)) ?? [];
      this.Suggestions = init.Suggestions?.map(s => new Suggestion(s)) ?? [];
      this.Page_Count = init.Page_Count ?? 0;
    }
  }
}
