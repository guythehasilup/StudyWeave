export interface OpenAiRequestInput {
  requestId: string;
  userId: string;
  message: string;
}

export interface OpenAiRequestResult {
  providerResponseId: string;
  responseText: string;
  inputTokens: number | null;
  outputTokens: number | null;
}

export type OpenAiFailureDisposition = 'failed' | 'uncertain';
