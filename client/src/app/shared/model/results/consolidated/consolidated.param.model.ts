export class ConsolidatedParamModel {
  q = "";
  page = 1;
  category = "all";
  platform = "all";
  content = "all";
  email?: string;
  username?: string;
  must=true
  url = "";
  user = "";
  fullsearch = false;


  reset(): void {
    this.q = "";
    this.page = 1;
    this.category = "all";
    this.platform = "all";
    this.content = "all";
    this.email = undefined;
    this.username = undefined;
    this.url = "";
    this.user = "";
    this.fullsearch = false;
  }
}
