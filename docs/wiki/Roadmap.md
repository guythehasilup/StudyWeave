# MVP Roadmap

The working backlog is maintained in [GitHub Issues](https://github.com/guythehasilup/StudyWeave/issues). Issue #1 is the high-level roadmap.

## Phase 1 — Foundation

- [#2 — Define solution architecture and conventions](https://github.com/guythehasilup/StudyWeave/issues/2)
- [#3 — Finalize and validate the OpenAPI contract](https://github.com/guythehasilup/StudyWeave/issues/3)
- [#4 — Implement simple users and authentication](https://github.com/guythehasilup/StudyWeave/issues/4)

### Exit condition

The project structure, public contract, identifier conventions, and minimal user boundary are clear enough for feature work.

## Phase 2 — Core study data

- [#5 — Implement course and topic management](https://github.com/guythehasilup/StudyWeave/issues/5)
- [#6 — Implement original-question submission and persistence](https://github.com/guythehasilup/StudyWeave/issues/6)
- [#7 — Add question image and attachment handling](https://github.com/guythehasilup/StudyWeave/issues/7)
- [#8 — Generate and store structured initial analysis](https://github.com/guythehasilup/StudyWeave/issues/8)

### Exit condition

A student can save an organized question and attempt, and the system can persist a validated structured analysis without losing work when the provider fails.

## Phase 3 — Learning workflow

- [#9 — Implement persistent follow-up questions and answers](https://github.com/guythehasilup/StudyWeave/issues/9)
- [#10 — Build question search, filtering, and full-thread retrieval](https://github.com/guythehasilup/StudyWeave/issues/10)
- [#11 — Build the Hebrew RTL dark MVP experience](https://github.com/guythehasilup/StudyWeave/issues/11)

### Exit condition

The complete learning thread is usable, searchable, persistent, and presented through the intended Hebrew RTL interface.

## Phase 4 — Quality

- [#12 — Add MVP tests, security checks, and reliability controls](https://github.com/guythehasilup/StudyWeave/issues/12)

### Exit condition

The end-to-end workflow is covered by appropriate tests, ownership boundaries are verified, and important provider and attachment failures behave predictably.

## Deferred ideas

Possible later work includes:

- mistake-pattern journal;
- flashcard generation;
- spaced repetition;
- similar-question detection;
- practice generation;
- course-material grounding and citations;
- PDF study-guide export;
- instructor verification;
- additional AI providers.

Deferred ideas should become issues only after the MVP workflow has been validated.
