import type { ZodType } from 'zod';

export abstract class BaseMessageMapper<TMessage> {
  protected constructor(private readonly schema: ZodType<TMessage>) {}

  public fromBuffer(content: Buffer): TMessage | null {
    const candidate = this.parseJson(content);

    const result = this.schema.safeParse(candidate);

    if (!result.success) {
      return null;
    }

    return result.data;
  }

  public toBuffer(message: TMessage): Buffer {
    const validatedMessage = this.schema.parse(message);

    return Buffer.from(JSON.stringify(validatedMessage), 'utf8');
  }

  private parseJson(content: Buffer): unknown {
    try {
      return JSON.parse(content.toString('utf8')) as unknown;
    } catch {
      return null;
    }
  }
}
