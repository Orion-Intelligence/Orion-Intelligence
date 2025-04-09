export class searchDynamicEmailParamModel {
  email?: string;
  username?: string;

  constructor(init?: Partial<searchDynamicEmailParamModel>) {
    if (init) {
      Object.assign(this, init);
    }
  }

  static validateEmail(email?: string): string | undefined {
    if (!email || /^[\w\.-]+@[\w\.-]+\.\w+$/.test(email)) {
      return email;
    }
    throw new Error("Invalid email format");
  }

  setEmail(email: string) {
    this.email = searchDynamicEmailParamModel.validateEmail(email);
  }

  toJSON() {
    return JSON.stringify(this);
  }
}
