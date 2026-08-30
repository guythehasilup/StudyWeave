# WeaveWorker POC

WeaveWorker is the separate TypeScript process that executes StudyWeave AI requests. The
StudyWeave server accepts and persists requests; RabbitMQ distributes durable request IDs; and
WeaveWorker claims each request in MongoDB before making one OpenAI Responses API call.

## Local prerequisites

- Node.js 24 LTS
- MongoDB running on `localhost:27017`
- RabbitMQ running on `localhost:5672`
- An OpenAI API key available only to WeaveWorker

RabbitMQ is free and open source when self-hosted. A local Docker instance with its management UI
bound only to localhost can be started with:

```powershell
docker run --detach --name studyweave-rabbitmq --publish 127.0.0.1:5672:5672 --publish 127.0.0.1:15672:15672 rabbitmq:4-management
```

The local management UI is then available at `http://localhost:15672`. The image's local default
credentials are `guest` / `guest`; use dedicated least-privilege credentials and TLS outside local
development.

## Configuration

Copy `.env.example` to `.env` and replace every placeholder. StudyWeave and WeaveWorker must use
the same MongoDB URI and RabbitMQ URL. Queue and exchange names are versioned application constants
in `common/messaging/mq-endpoints.ts`. The OpenAI key must not be added to the StudyWeave server or
client environments.

Recommended local non-secret values are:

```dotenv
MONGODB_URI=mongodb://localhost:27017/studyweave
RABBITMQ_URL=amqp://localhost:5672
OPENAI_MODEL=gpt-5.6-terra
OPENAI_TIMEOUT_MS=120000
OPENAI_MAX_OUTPUT_TOKENS=1200
WEAVE_WORKER_CONCURRENCY=1
WEAVE_WORKER_PROCESSING_LEASE_MS=120000
WEAVE_WORKER_HEARTBEAT_MS=30000
RABBITMQ_RECONNECT_DELAY_MS=5000
AI_RESULT_PUBLISH_INTERVAL_MS=2000
AI_RESULT_PUBLISH_LEASE_MS=30000
```

Add `OPENAI_API_KEY` and, optionally, a unique `WEAVE_WORKER_ID` directly to the untracked `.env`.

## Run locally

In separate terminals:

```powershell
cd C:\studyweave\StudyWeave\src\studyweave\server
npm run dev
```

```powershell
cd C:\studyweave\StudyWeave\src\weaveworker
npm run dev
```

## Authenticated API flow

All endpoints require the existing JWT bearer token.

1. `POST /api/requests` with a client-generated UUID and a message:

   ```json
   {
     "clientRequestId": "9c6af8f5-7e4f-4554-946b-daefc1f503b9",
     "message": "Explain opportunity cost"
   }
   ```

2. Poll `GET /api/requests/{requestId}` using the server-generated `requestId` returned by the
   create call.
3. Abort with `POST /api/requests/{requestId}/abort`.

Create is idempotent per user and `clientRequestId`. The work command contains only the
server-generated request ID. WeaveWorker persists a terminal outcome in its result outbox before
acknowledging that command. It then publishes the result to the durable result queue; StudyWeave
persists it before acknowledging the result event. If provider delivery becomes ambiguous, the
request becomes `uncertain` and is not sent to OpenAI again automatically.

Result events contain the generated response and usage metadata. Production RabbitMQ must
therefore be private, use TLS, and grant each process only the permissions it requires.

Multiple WeaveWorker instances may consume the same quorum queue. MongoDB leases prevent two
instances from executing the same request, and a fanout exchange delivers active cancellation
signals to every connected worker. `WEAVE_WORKER_CONCURRENCY` is per instance; a future production
phase should add a shared rate-budget allocator if a strict account-wide OpenAI limit is required.
