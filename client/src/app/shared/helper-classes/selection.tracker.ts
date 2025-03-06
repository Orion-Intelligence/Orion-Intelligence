export class SelectionTracker {
  section: string | null = null;
  option: string | null = null;

  constructor() {
    this.section = "Homepage"
  }

  setSection(newSection: string): void {
    this.section = newSection;
    this.option = null;
  }

  setOption(newOption: string): void {
    this.option = newOption;
  }

  getSelectedSection(): string | null {
    return this.section;
  }

  getSelectedOption(): string | null {
    return this.option;
  }
}
