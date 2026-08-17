export class BaseError extends Error {
  public constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'BaseError';
  }
}
