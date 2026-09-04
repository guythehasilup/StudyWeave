import type { QuestionContent } from '@studyweave/swwai-contract';
import type OpenAI from 'openai';
import type { AnswerGenerator } from '../../questions/answer-generator.js';

/**
 * Convert shared question parts to OpenAI Responses API input content.
 *
 * The exhaustive switch becomes a compile-time reminder to map future image
 * contract parts when multimodal support is added.
 *
 * @param content - Validated shared question content.
 * @returns OpenAI text input parts in their original order.
 * @example
 * const input = toOpenAiInput(content);
 */
const toOpenAiInput = (content: QuestionContent) =>
  content.parts.map((part) => {
    switch (part.type) {
      case 'text':
        return { type: 'input_text' as const, text: part.text };
    }
  });

/**
 * Create the provider adapter backed by OpenAI's Responses API.
 *
 * @param client - Official OpenAI SDK client initialized during bootstrap.
 * @param model - Explicit configured model identifier.
 * @returns A provider-neutral answer generator supporting abort signals.
 * @example
 * const generateAnswer = createOpenAiAnswerGenerator(client, config.openAiModel);
 */
export const createOpenAiAnswerGenerator =
  (client: OpenAI, model: string): AnswerGenerator =>
  async (content, signal) => {
    const response = await client.responses.create(
      {
        model,
        input: [{ role: 'user', content: toOpenAiInput(content) }],
        store: false,
      },
      { signal },
    );
    const answer = response.output_text.trim();

    if (answer.length === 0) throw new Error('OPENAI_EMPTY_RESPONSE');

    return { answer, providerResponseId: response.id };
  };
