export class ConsolidatedParamModel {
  q = "";
  page = 1;
  category = "all";
  platform = "all";
  content = "all";
  email?: string;
  username?: string;
  must=true
  mURL = "";
  mUser = "";
  mFullSearch = false;


  reset(): void {
    this.q = "";
    this.page = 1;
    this.category = "all";
    this.platform = "all";
    this.content = "all";
    this.email = undefined;
    this.username = undefined;
    this.mURL = "";
    this.mUser = "";
    this.mFullSearch = false;
  }
}
