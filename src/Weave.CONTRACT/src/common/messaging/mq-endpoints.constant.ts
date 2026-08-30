import { weaveMessageTypes } from './message-types.constant.js';

const quorumQueueOptions = {
  durable: true,
  arguments: {
    'x-queue-type': 'quorum',
  },
} as const;

const durableFanoutExchangeOptions = {
  durable: true,
} as const;

export const mqEndpoints = {
  aiRequests: {
    queue: 'studyweave.ai.requests.v1',
    messageType: weaveMessageTypes.aiRequest,
    queueOptions: quorumQueueOptions,
  },
  aiResults: {
    queue: 'studyweave.ai.results.v1',
    messageType: weaveMessageTypes.aiResult,
    queueOptions: quorumQueueOptions,
  },
  aiCancellations: {
    exchange: 'studyweave.ai.cancellations.v1',
    exchangeType: 'fanout',
    messageType: weaveMessageTypes.aiCancellation,
    exchangeOptions: durableFanoutExchangeOptions,
  },
  quarantine: {
    queue: 'studyweave.ai.quarantine.v1',
    messageType: weaveMessageTypes.quarantinedMessage,
    queueOptions: quorumQueueOptions,
  },
} as const;
