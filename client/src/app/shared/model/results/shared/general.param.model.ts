export class GeneralParamModel {
  q = "";
  mSearchParamType = "all";
  mSearchParamPage = 1;
  mSearchParamSafeSearch = false;
  mNetwork = "all";
  mDateRange = ""
  mContentType = "all"
  mEntity = ""

  constructor(init?: Partial<GeneralParamModel>) {
    Object.assign(this, init);
  }
}
