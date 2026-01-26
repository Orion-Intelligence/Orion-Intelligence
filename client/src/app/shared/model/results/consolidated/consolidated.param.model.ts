export class ConsolidatedParamModel {
  q = "";
  page = 1;
  category = "all";
  profile = false;
  platform = "all";
  content = "all";
  email?: string;
  username?: string;
  must = true
  url = "";
  user = "";
  ioc = "";
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
    this.ioc = "";
    this.fullsearch = false;
  }
}
