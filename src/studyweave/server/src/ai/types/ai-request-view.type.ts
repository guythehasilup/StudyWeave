import type { AiRequestStatus } from '../../infra/ai-requests/types/ai-request.type.js';

export interface AiRequestView {
  requestId: string;
  clientRequestId: string;
  status: AiRequestStatus;
  responseText: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}
