# weaveworker

weaveworker owns AI execution for StudyWeave. It consumes versioned question commands from
RabbitMQ, calls the configured OpenAI model through the Responses API, and publishes status or
result events. It does not expose HTTP routes or write the server's question collection.

## Local use

1. Copy .env.example to .env and set OPENAI_API_KEY and OPENAI_MODEL.
2. Ensure RabbitMQ is available at RABBITMQ_URL.
3. Install dependencies with npm install.
4. Start the worker with npm run dev.

Cancellation is best effort. Every worker replica receives cancellation broadcasts and aborts a
matching request when that request is running in its process. A cancellation received before the
request is held briefly so queue ordering does not make the stop action ineffective.

`OPENAI_RATE_LIMIT_MAX_REQUESTS` and `OPENAI_RATE_LIMIT_WINDOW_MS` limit provider request starts per
worker process. Deliveries wait without being acknowledged when the quota is exhausted, so they are
not discarded and cancellation remains abortable. When multiple worker replicas run, allocate the
provider quota across replicas or replace the injected limiter with a distributed implementation.
