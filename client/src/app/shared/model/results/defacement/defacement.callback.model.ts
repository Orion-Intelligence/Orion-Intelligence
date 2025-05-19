export class DefacementParamModel {
  q: string = "";
  mSearchParamPage: number = 1;
  mDateRange: string = ""
  mTeam: string = ""
  mAttacker: string = "";

  constructor(init?: Partial<DefacementParamModel>) {
    Object.assign(this, init);
  }

  toJSON() {
    return JSON.stringify(this);
  }
}

