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

These are current design decisions and can still change before implementation.

## Documentation

The project documentation lives in the [StudyWeave Wiki](https://github.com/guythehasilup/StudyWeave/wiki):

- [Product overview](https://github.com/guythehasilup/StudyWeave/wiki/Product-Overview)
- [Architecture](https://github.com/guythehasilup/StudyWeave/wiki/Architecture)
- [Data model](https://github.com/guythehasilup/StudyWeave/wiki/Data-Model)
- [API workflow](https://github.com/guythehasilup/StudyWeave/wiki/API-Workflow)
- [Development guide](https://github.com/guythehasilup/StudyWeave/wiki/Development-Guide)
- [Roadmap](https://github.com/guythehasilup/StudyWeave/wiki/Roadmap)

## Roadmap

See [issue #1](https://github.com/guythehasilup/StudyWeave/issues/1) for the high-level roadmap and the [wiki roadmap](https://github.com/guythehasilup/StudyWeave/wiki/Roadmap) for links to every task.

## License

StudyWeave is licensed under the [MIT License](LICENSE).
