export class SuggestionOption {
  text = "";

  constructor(init?: Partial<SuggestionOption>) {
    Object.assign(this, init);
  }
}
export class Suggestion {
  text = "";
  offset = 0;
  length = 0;
  options: SuggestionOption[] = [];

  constructor(init?: Partial<Suggestion>) {
    if (init) {
      this.text = init.text || "";
      this.offset = init.offset || 0;
      this.length = init.length || 0;
      this.options = init.options?.map(opt => new SuggestionOption(opt)) ?? [];
    }
  }
}
