export class CredentialParamModel {
  mDateRange = ""
  mURL = ""
  mUser = ""
  mFullSearch = false

  constructor(init?: Partial<CredentialParamModel>) {
    Object.assign(this, init);
  }
}

