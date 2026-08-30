export interface AiRequestCommand {
  version: 1;
  requestId: string;
}

export interface AiCancellationCommand {
  version: 1;
  requestId: string;
}
