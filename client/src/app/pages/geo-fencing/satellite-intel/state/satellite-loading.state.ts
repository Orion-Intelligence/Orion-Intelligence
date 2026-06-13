export class SatelliteLoadingState {
  private sequence = 0;
  private readonly requests = new Map<number, { title: string; message: string }>();

  isLoading = false;
  title = 'Loading Satellite Intel';
  message = 'Please wait while the request completes...';

  begin(title: string, message: string): number {
    const id = ++this.sequence;
    this.requests.set(id, { title, message });
    this.syncState();
    return id;
  }

  end(id: number): void {
    if (!this.requests.has(id)) {
      return;
    }
    this.requests.delete(id);
    this.syncState();
  }

  clear(): void {
    this.requests.clear();
    this.syncState();
  }

  private syncState(): void {
    const latestRequest = Array.from(this.requests.values()).at(-1) ?? null;
    this.isLoading = this.requests.size > 0;

    if (!latestRequest) {
      this.title = 'Loading Satellite Intel';
      this.message = 'Please wait while the request completes...';
      return;
    }

    this.title = latestRequest.title;
    this.message = latestRequest.message;
  }
}
