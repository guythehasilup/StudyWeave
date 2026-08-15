# StudyWeave Wiki

This wiki records the current product and engineering decisions for StudyWeave.

> **Status:** The project is in planning and API-design stage. The documents describe the intended MVP, not completed functionality.

## What is StudyWeave?

StudyWeave is a study workspace where one saved question contains:

- the original academic question;
- the student's attempted solution;
- a structured initial AI analysis;
- persistent follow-up questions and answers;
- searchable learning metadata.

Leaving the page does not discard the discussion. The full learning thread is stored and can be reopened later.

## Wiki pages

| Page | Contents |
|---|---|
| [Product overview](Product-Overview.md) | Problem, goals, MVP scope, and interface direction |
| [Architecture](Architecture.md) | System boundaries, components, and AI integration |
| [Data model](Data-Model.md) | Entities, identifiers, and question aggregate |
| [API workflow](API-Workflow.md) | Current endpoints and request flows |
| [Development guide](Development-Guide.md) | Proposed structure and engineering conventions |
| [Roadmap](Roadmap.md) | Implementation phases and GitHub issues |

## Source of truth

Use these sources in this order when documents disagree:

1. An explicitly approved product decision.
2. The current [OpenAPI contract](../../studyweave-openapi.yaml) for HTTP behavior.
3. Accepted GitHub issues and their acceptance criteria.
4. This wiki for explanatory context.

Update the relevant wiki page when an architectural or product decision changes.
