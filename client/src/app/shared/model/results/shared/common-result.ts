export class SuggestionOption {
  text: string = "";
  score: number = 0;
  freq: number = 0;

  constructor(init?: Partial<SuggestionOption>) {
    Object.assign(this, init);
  }
}

export class Suggestion {
  text: string = "";
  offset: number = 0;
  length: number = 0;
  options: SuggestionOption[] = [];

  constructor(init?: Partial<Suggestion>) {
    if (init) {
      this.text = init.text || "";
      this.offset = init.offset || 0;
      this.length = init.length || 0;
      this.options = init.options?.map(opt => new SuggestionOption(opt)) || [];
    }
  }
}
