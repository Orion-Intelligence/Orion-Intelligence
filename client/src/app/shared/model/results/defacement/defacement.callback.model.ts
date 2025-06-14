export class DefacementParamModel {
  q = "";
  mSearchParamPage = 1;
  mDateRange = ""
  mTeam = ""
  mAttacker = "";

  constructor(init?: Partial<DefacementParamModel>) {
    Object.assign(this, init);
  }

  toJSON() {
    return JSON.stringify(this);
  }
}

