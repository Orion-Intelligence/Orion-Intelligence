export class DefacementParamModel {
  q = "";
  mSearchParamPage = 1;
  mDateRange = ""
  mTeam = ""
  mAttacker = "";
  mContentType = ""

  constructor(init?: Partial<DefacementParamModel>) {
    Object.assign(this, init);
  }
}

