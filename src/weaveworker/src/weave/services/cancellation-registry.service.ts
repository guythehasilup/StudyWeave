export class CancellationRegistryService {
  private readonly activeRequests = new Map<string, AbortController>();

  public register(requestId: string): AbortController {
    const controller = new AbortController();

    this.activeRequests.set(requestId, controller);

    return controller;
  }

  public remove(requestId: string): void {
    this.activeRequests.delete(requestId);
  }

  public abort(requestId: string): boolean {
    const controller = this.activeRequests.get(requestId);

    if (!controller) {
      return false;
    }

    controller.abort();

    return true;
  }

  public abortAll(): void {
    for (const controller of this.activeRequests.values()) {
      controller.abort();
    }

    this.activeRequests.clear();
  }
}

export const cancellationRegistryService = new CancellationRegistryService();
