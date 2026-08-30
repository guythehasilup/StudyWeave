import { BaseMapper } from '../../common/mappers/base.mapper.js';
import { he } from '../../common/resources/he.resource.js';
import type { AiRequestDocument } from '../../infra/ai-requests/types/ai-request.type.js';
import type { AiRequestView } from '../types/ai-request-view.type.js';

export class AiRequestMapper extends BaseMapper<AiRequestDocument, AiRequestView> {
  public toViewModel(request: AiRequestDocument): AiRequestView {
    let errorMessage: string | null = null;

    if (request.status === 'failed') {
      errorMessage = he.ai.failed;
    }

    if (request.status === 'uncertain') {
      errorMessage = he.ai.uncertain;
    }

    return {
      requestId: request.id,
      clientRequestId: request.clientRequestId,
      status: request.status,
      responseText: request.responseText,
      errorMessage,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      completedAt: request.completedAt,
    };
  }

  public toModel(viewModel: AiRequestView): Partial<AiRequestDocument> {
    return {
      id: viewModel.requestId,
      clientRequestId: viewModel.clientRequestId,
      status: viewModel.status,
      responseText: viewModel.responseText,
      createdAt: viewModel.createdAt,
      updatedAt: viewModel.updatedAt,
      completedAt: viewModel.completedAt,
    };
  }
}

export const aiRequestMapper = new AiRequestMapper();
