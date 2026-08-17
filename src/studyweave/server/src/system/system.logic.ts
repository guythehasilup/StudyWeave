import { BaseLogic } from '../common/logic/base.logic.js';
import { he } from '../common/resources/he.resource.js';
import type { ApiInfoResponse } from './types/api-info-response.type.js';
import type { HealthResponse } from './types/health-response.type.js';

export class SystemLogic extends BaseLogic {
  public getApiInfo(): Promise<ApiInfoResponse> {
    return this.execute(() => ({ message: he.server.apiName }));
  }

  public getHealth(): Promise<HealthResponse> {
    return this.execute(() => ({ status: he.server.healthy }));
  }
}

export const systemLogic = new SystemLogic();
