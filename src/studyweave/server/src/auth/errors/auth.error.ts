import { BaseError } from '../../common/errors/base.error.js';

export class AuthError extends BaseError {
  public constructor(statusCode: number, message: string) {
    super(statusCode, message);
    this.name = 'AuthError';
  }
}
