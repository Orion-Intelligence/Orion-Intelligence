export class CredentialParamModel {
  q = "";

  constructor(init?: Partial<CredentialParamModel>) {
    Object.assign(this, init);
  }
}

