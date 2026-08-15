# StudyWeave

StudyWeave is a planned study workspace that turns each academic question into a persistent learning thread.

A student submits the original question and their attempted solution, receives structured AI feedback, asks follow-up questions in the same workspace, and can later search and reopen the complete conversation.

> **Project status:** Planning and API design. Application code has not been implemented yet.

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

| Area | Direction |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | ASP.NET Core Web API |
| Database | MongoDB |
| API contract | OpenAPI 3.0 |
| AI integration | Provider abstraction with structured initial output |
| Interface | Hebrew RTL with a dark default theme |

These are current design decisions and can still change before implementation.

## Repository contents

| Path | Purpose |
|---|---|
| [`studyweave-openapi.yaml`](studyweave-openapi.yaml) | Initial HTTP API contract |
| [`docs/wiki/`](docs/wiki/Home.md) | Product and engineering wiki |
| [Issues](https://github.com/guythehasilup/StudyWeave/issues) | MVP backlog and acceptance criteria |
| [`LICENSE`](LICENSE) | MIT license |

## Identity model

Persisted resources use two identifiers:

- `_id`: MongoDB-generated ObjectId, used by persistence.
- `id`: application-generated UUID, used as the public API identifier.

Clients and URL parameters should use UUIDs. They should not need to understand MongoDB ObjectIds.

## Documentation

Start with the [wiki home](docs/wiki/Home.md):

- [Product overview](docs/wiki/Product-Overview.md)
- [Architecture](docs/wiki/Architecture.md)
- [Data model](docs/wiki/Data-Model.md)
- [API workflow](docs/wiki/API-Workflow.md)
- [Development guide](docs/wiki/Development-Guide.md)
- [MVP roadmap](docs/wiki/Roadmap.md)

## Roadmap

The initial backlog is organized into four phases:

1. Foundation
2. Core study data
3. Learning workflow
4. Quality

See [issue #1](https://github.com/guythehasilup/StudyWeave/issues/1) for the high-level roadmap and the [wiki roadmap](docs/wiki/Roadmap.md) for links to every task.

## License

StudyWeave is licensed under the [MIT License](LICENSE).
