export class SearchLeakParamModel {
  q: string = "";
  pSearchParamType: string = "all";
  mSearchParamPage: number = 1;
  mSearchParamSafeSearch: boolean = false;
  mNetwork: string = "all";

  constructor(init?: Partial<SearchLeakParamModel>) {
    Object.assign(this, init);
  }

  toJSON() {
    return JSON.stringify(this);
  }
}
