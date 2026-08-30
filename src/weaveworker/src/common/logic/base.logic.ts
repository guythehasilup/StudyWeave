export abstract class BaseLogic {
  protected async execute<T>(operation: () => T | Promise<T>): Promise<T> {
    return operation();
  }
}
