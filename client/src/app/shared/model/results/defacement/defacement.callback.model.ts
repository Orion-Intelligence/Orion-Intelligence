export class DefacementParamModel {
  q: string = "";
  mSearchParamPage: number = 1;

  constructor(init?: Partial<DefacementParamModel>) {
    Object.assign(this, init);
  }

  toJSON() {
    return JSON.stringify(this);
  }
}
