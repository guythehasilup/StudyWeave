export const mqEndpoints = {
  aiRequests: {
    queue: 'studyweave.ai.requests.v1',
    messageType: 'studyweave.ai.request.v1',
  },
  aiResults: {
    queue: 'studyweave.ai.results.v1',
    messageType: 'studyweave.ai.result.v1',
  },
  aiCancellations: {
    exchange: 'studyweave.ai.cancellations.v1',
    messageType: 'studyweave.ai.cancellation.v1',
  },
} as const;
