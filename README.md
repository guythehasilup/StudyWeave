# StudyWeave

StudyWeave is a planned study workspace that turns each academic question into a persistent learning thread.

A student submits the original question and their attempted solution, receives structured AI feedback, asks follow-up questions in the same workspace, and can later search and reopen the complete conversation.

> **Project status:** Authentication and an asynchronous AI-question POC are implemented. The
> broader study-workspace capabilities in the OpenAPI document remain planned.

## Core workflow

1. Create a course and one or more topics.
2. Submit a question using text and, later, supported attachments.
3. Add the student's attempted solution.
4. Generate and store a structured initial analysis.
5. Ask natural follow-up questions inside the saved question.
6. Search and reopen the complete learning thread later.

## Product principles

- **Preserve the student's work.** Correct steps should remain visible instead of being replaced unnecessarily.
- **Find the first mistake.** Feedback should identify where reasoning first went wrong.
- **Separate analysis from conversation.** The canonical analysis is structured; follow-ups remain natural messages.
- **Make learning history reusable.** Questions should form a searchable personal knowledge base.
- **Be honest about AI confidence.** AI-reviewed content is not the same as instructor-verified content.
- **Design for Hebrew.** The initial interface is Hebrew RTL, dark by default, and spacious enough for long explanations and mathematics.

## Planned technology

| Area           | Direction                                                             |
| -------------- | --------------------------------------------------------------------- |
| Frontend       | React, TypeScript, Vite, Material UI, React Hook Form, TanStack Query |
| Backend        | Express and TypeScript                                                |
| Database       | MongoDB through the official Node.js driver                           |
| API contract   | OpenAPI 3.0                                                           |
| AI integration | Provider abstraction with structured initial output                   |
| Messaging      | RabbitMQ with versioned contracts and confirmed publishing            |

These are current design decisions and can still change before implementation.

## Local applications

The runnable applications live in `src/studyweave/client`, `src/studyweave/server`, and
`src/studyweave/weaveworker`. Shared versioned models, message schemas, and RabbitMQ transport
live in `src/studyweave/SwWAI.contract`. Each package has its own scripts for development,
formatting, tests, and production builds.

The server requires MongoDB, RabbitMQ, `MONGODB_URI`, and a JWT secret of at least 32 characters
in `JWT_SECRET`. The worker requires the same RabbitMQ broker plus `OPENAI_API_KEY` and an explicit
`OPENAI_MODEL`. Copy each application's `.env.example` to `.env`, install dependencies in all
four package folders, then run the client, server, and worker with `npm run dev`.

## Asynchronous question POC

1. The authenticated client submits extensible question content to the server.
2. The server persists `queued` state, publishes a durable command, and immediately returns 202.
3. `weaveworker` consumes the command and calls OpenAI through a provider-neutral operation.
4. Worker lifecycle events update the question and persist AI outcomes in a separate response.
5. The client polls the owner-scoped question endpoint until it reaches a terminal state.

RabbitMQ uses at-least-once delivery, manual acknowledgements, publisher confirms, and a dead-letter
queue. Server status transitions are guarded so redelivery cannot overwrite terminal or cancelled
state. Stop is best effort and is broadcast to every worker replica so the process that owns an
in-flight provider request can abort it.

Question submission is limited per authenticated user at the server boundary. AI request starts
are limited separately inside each worker process; excess RabbitMQ deliveries wait for quota rather
than being discarded. These POC limiters are process-local and use injectable contracts so a shared
distributed limiter can replace them when the services are horizontally scaled.

## Roadmap

See [issue #1](https://github.com/guythehasilup/StudyWeave/issues/1) for the high-level roadmap and the [wiki roadmap](https://github.com/guythehasilup/StudyWeave/wiki/Roadmap) for links to every task.

## License

StudyWeave is licensed under the [MIT License](LICENSE).
