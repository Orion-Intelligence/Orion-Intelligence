import { Suggestion } from "../shared/common-result";

export class CredentialResultItem {
  u: string = "";
  l: string[] = [];
  s: string = "";
  g: string = "";
  c?: string;

  constructor(init?: Partial<CredentialResultItem>) {
    Object.assign(this, init);
  }
}

export class CredentialCallbackModel {
  Result: CredentialResultItem[] = [];
  Page_Count: number = 0;
  Suggestions: Suggestion[] = [];

  constructor(init?: Partial<CredentialCallbackModel>) {
    if (init) {
      this.Result = init.Result?.map(r => new CredentialResultItem(r)) ?? [];
      this.Suggestions = init.Suggestions?.map(s => new Suggestion(s)) ?? [];
      this.Page_Count = init.Page_Count ?? 0;
    }
  }
}
