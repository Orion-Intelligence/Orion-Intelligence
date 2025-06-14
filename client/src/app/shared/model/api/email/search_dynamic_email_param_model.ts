export class searchDynamicEmailParamModel {
  email?: string;
  username?: string;

  constructor(init?: Partial<searchDynamicEmailParamModel>) {
    if (init) {
      Object.assign(this, init);
    }
  }
}
