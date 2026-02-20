export class RankedCallbackModel {
  result: any[] = [];
  pageCount: number = 0;
  totalHits: number = 0;

  constructor(init?: Partial<RankedCallbackModel>) {
    if (init) {
      this.result = init.result ?? [];
      this.pageCount = init.pageCount ?? 0;
      this.totalHits = init.totalHits ?? 0;
    }
  }
}
