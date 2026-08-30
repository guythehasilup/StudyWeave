import { BaseError } from '../../common/errors/base.error.js';

export class AiRequestError extends BaseError {
  public constructor(statusCode: number, message: string) {
    super(statusCode, message);
    this.name = 'AiRequestError';
  }
}
