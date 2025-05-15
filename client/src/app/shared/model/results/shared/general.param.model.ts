export class GeneralParamModel {
  q: string = "";
  pSearchParamType: string = "all";
  mSearchParamPage: number = 1;
  mSearchParamSafeSearch: boolean = false;
  mNetwork: string = "all";
  mDateRange: string = ""
  mContentType: string = "all"
  mEntity: string = ""

  constructor(init?: Partial<GeneralParamModel>) {
    Object.assign(this, init);
  }
}
