# Development Guide

> The repository does not contain application code yet. Commands and setup instructions should be added only after the solution is scaffolded and verified.

## Proposed repository shape

```text
StudyWeave/
├── src/
│   ├── StudyWeave.Api/
│   ├── StudyWeave.Application/
│   ├── StudyWeave.Domain/
│   ├── StudyWeave.Infrastructure/
│   └── studyweave-web/
├── tests/
├── docs/
│   └── wiki/
├── studyweave-openapi.yaml
└── README.md
```

This is a starting point, not a requirement to create unnecessary projects. Prefer clear dependency boundaries over ceremony.

## Engineering conventions

### API

- Treat the OpenAPI contract as the shared frontend/backend agreement.
- Use UUIDs in public routes and DTO relationships.
- Keep MongoDB `_id` as a persistence detail.
- Return consistent Problem Details responses.
- Validate all externally supplied data.
- Pass cancellation tokens through asynchronous backend operations.

### Backend

- Controllers should translate HTTP concerns and call application use cases.
- Application services should orchestrate workflows.
- Domain models should not depend on a provider SDK.
- Infrastructure should implement MongoDB, storage, and AI-provider interfaces.
- Secrets belong in environment-specific secret storage, never committed configuration.

### Frontend

- Set the application document direction to RTL.
- Build layouts and components with RTL behavior in mind from the start.
- Use a dark default theme with accessible contrast.
- Keep long Hebrew explanations readable through width, spacing, and line height.
- Render mathematical content with a dedicated math-rendering library when implemented.
- Keep network state and errors visible to the user.

### AI integration

- Keep AI calls on the backend.
- Validate structured output before mapping it to persisted analysis.
- Save provider/model metadata for diagnostics.
- Handle refusal, timeout, invalid output, and transient provider failure.
- Never label an AI result as instructor verification.

## Working with issues

The MVP is split into bounded GitHub issues. Before implementing an issue:

1. Read its goal, scope, and acceptance criteria.
2. Identify contract or documentation changes first.
3. Keep unrelated changes out of the branch.
4. Add or update relevant tests.
5. Update wiki pages when a decision changes.

Start with [the MVP roadmap](https://github.com/guythehasilup/StudyWeave/issues/1).

## Pull-request expectations

A future pull request should explain:

- what changed;
- why it changed;
- important design decisions;
- how it was validated;
- remaining limitations.

Prefer small pull requests that complete one coherent task.
