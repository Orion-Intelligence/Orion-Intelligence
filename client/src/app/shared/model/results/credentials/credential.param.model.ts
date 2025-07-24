export class CredentialParamModel {
  q = "";
  mDateRange = ""

  constructor(init?: Partial<CredentialParamModel>) {
    Object.assign(this, init);
  }
}

