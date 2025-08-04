export class ConsolidatedParamModel {
  q = "";
  page = 1;
  content = "";
  daterange = "";
  entity = "";
  mitre = "";
  category = "all";
  safe = false;
  network = "all";
  team = "";
  attacker: string[] = [];
  platform = "";
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
    this.network = "all";
    this.daterange = "";
    this.content = "";
    this.entity = "";
    this.mitre = "";
    this.team = "";
    this.attacker = [];
    this.team = "";
    this.safe = false;
    this.email = undefined;
    this.username = undefined;
    this.platform = "";
    this.mURL = "";
    this.mUser = "";
    this.mFullSearch = false;
  }
}
