export class search_dynamic_email_param_model {
  email?: string;
  username?: string;

  constructor(init?: Partial<search_dynamic_email_param_model>) {
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
    this.email = search_dynamic_email_param_model.validateEmail(email);
  }

  toJSON() {
    return JSON.stringify(this);
  }
}
