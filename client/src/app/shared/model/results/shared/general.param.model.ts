export class GeneralParamModel {
  q: string = "";
  pSearchParamType: string = "all";
  mSearchParamPage: number = 1;
  mSearchParamSafeSearch: boolean = false;
  mNetwork: string = "all";

  constructor(init?: Partial<GeneralParamModel>) {
    Object.assign(this, init);
  }

  toJSON() {
    return JSON.stringify(this);
  }
}
