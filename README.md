# StudyWeave

StudyWeave is a planned study workspace that turns each academic question into a persistent learning thread.

A student submits the original question and their attempted solution, receives structured AI feedback, asks follow-up questions in the same workspace, and can later search and reopen the complete conversation.

> **Project status:** The React and Express authentication foundation is implemented. The
> study-workspace capabilities in the OpenAPI document remain planned.

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
| Frontend | React, TypeScript, Vite, Material UI, React Hook Form, TanStack Query |
| Backend | Express and TypeScript |
| Database | MongoDB through the official Node.js driver |
| API contract | OpenAPI 3.0 |
| AI integration | Provider abstraction with structured initial output |

These are current design decisions and can still change before implementation.

## Local applications

The runnable applications live in `src/studyweave/client` and `src/studyweave/server`. Each has
its own package scripts for development, formatting, tests, and production builds. The server
requires `MONGODB_URI` and a JWT secret of at least 32 characters in `JWT_SECRET`; the remaining
settings have development defaults in `src/studyweave/server/src/config/environment.ts`.

## Roadmap

See [issue #1](https://github.com/guythehasilup/StudyWeave/issues/1) for the high-level roadmap and the [wiki roadmap](https://github.com/guythehasilup/StudyWeave/wiki/Roadmap) for links to every task.

## License

StudyWeave is licensed under the [MIT License](LICENSE).
