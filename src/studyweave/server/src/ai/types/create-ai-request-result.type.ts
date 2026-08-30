import type { AiRequestView } from './ai-request-view.type.js';

export interface CreateAiRequestResult {
  created: boolean;
  request: AiRequestView;
}
