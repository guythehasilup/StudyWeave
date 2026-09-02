---
name: apply-shared-code-conventions
description: Apply shared full-stack TypeScript conventions across backend and frontend code, including const-first declarations, function-first design, class justification, TSDoc documentation with examples and defaults, English/Hebrew typed resource localization, stable error keys, folder and naming conventions, immutable contracts, and review checklists. Use when creating, editing, reviewing, or organizing TypeScript code shared by React and Express projects, or whenever project-wide coding and localization consistency is requested.
---

# Apply Shared Code Conventions

Apply one coherent set of TypeScript, documentation, naming, contract, and localization rules across the frontend and backend.

## Resolve priorities

1. Follow the user's current request and repository-level instructions.
2. Preserve an established project convention when changing it would create inconsistency, unless the user explicitly requests migration.
3. Apply this skill to new code and touched code. Do not mechanically rewrite unrelated files.
4. Explain any necessary exception next to the code or in the implementation summary.

## Use const-first TypeScript

- Declare bindings with `const` by default.
- Use `let` only when the same binding must be reassigned and a clearer expression cannot avoid reassignment.
- Never use `var`.
- Do not uppercase every `const`. Use `UPPER_SNAKE_CASE` only for module-level fixed configuration, resource maps, and genuine constants; use camelCase for ordinary local bindings.
- Prefer readonly inputs, immutable updates, and pure functions. Do not mutate arguments or shared exported objects.
- Avoid `any`. Use `unknown` at untrusted boundaries, then narrow through validation or type guards.
- Prefer discriminated unions for finite states and `as const` for fixed key maps.

## Prefer functions over classes

- Use plain functions, factory functions, closures, and object composition by default.
- Require a concrete justification for every new class: framework requirement, lifecycle-managed mutable state, polymorphic behavior that is clearer than a union, or an invariant best protected by an instance.
- Use React function components and hooks. Permit a React class only for a documented legacy/framework constraint, such as an error boundary when the installed stack has no suitable function-based wrapper.
- Do not create static utility classes; export functions from a focused module.

## Document code contracts

Add a TSDoc/JSDoc block to every named function, local callback, event handler, method, React component, hook, and class. Also document every exported type and every complex internal type. Treat a nested object type, a generic type, a discriminated union, or an object type with four or more properties as complex. Do not skip documentation merely because a declaration is not exported. Inline callbacks may remain inline when their behavior is obvious. Include:

- what it does and the important behavior or side effect;
- every parameter and property whose meaning is not self-evident;
- the return value;
- default values when a parameter or property is optional or defaulted;
- thrown or returned error behavior when relevant;
- a short `@example` showing normal use.

Keep comments accurate and explain intent, constraints, or decisions. Do not narrate syntax line by line. Update comments whenever the contract changes.

Read [typescript-and-documentation.md](references/typescript-and-documentation.md) for patterns and examples.

## Localize all product text

- Put every human-readable runtime product string in typed resource dictionaries, including UI labels, headings, helper text, validation, notifications, accessibility labels, email/template text, and client-visible API errors.
- Maintain complete English (`en`) and Hebrew (`he`) resources for every key. Treat Hebrew as RTL and English as LTR.
- Access resources only through the shared `translate` method or its React hook wrapper. Do not import dictionaries directly into features.
- Use stable semantic keys such as `users.actions.approve`; do not use the English sentence itself as the key.
- Let backend APIs return stable error codes and optional resource keys. Translate at the presentation boundary.
- Permit literal human-readable text in structured server logs. Keep logs language-stable and diagnostic; do not translate them.
- Treat code identifiers, developer comments, tests, protocol values, and stored domain data as non-product text. Do not put those values into localization resources.

Read [localization.md](references/localization.md) whenever adding or changing resources, translation parameters, backend error keys, language selection, or RTL behavior.

## Follow shared naming and structure

- Use PascalCase for components, types, classes, and enums.
- Use camelCase for functions, hooks, variables, parameters, and object properties.
- Prefix hooks with `use`; prefix booleans with `is`, `has`, `can`, or `should`.
- Use UPPER_SNAKE_CASE only for genuine module-level constants.
- Use names that reveal business meaning and responsibility. Avoid vague modules such as `helpers.ts`, `common.ts`, or `utils.ts`.
- Use feature/domain-first folders and keep framework adapters at the edges.
- Keep shared API/event DTOs versioned and dependency-light. Never share database models or Mongoose documents with the frontend.

Read [naming-and-structure.md](references/naming-and-structure.md) for the recommended repository layout and dependency boundaries.

## Verify every change

- Confirm declarations are `const` unless reassignment is necessary.
- Confirm each class has a real documented justification.
- Scan every named function/method/class/component/hook and every exported or complex type; confirm required TSDoc includes purpose, defaults where applicable, and an example.
- Search touched production code for human-readable literals and move product text to both resource dictionaries.
- Confirm English/Hebrew keys are identical and parameter placeholders match.
- Confirm public types, API DTOs, and event contracts do not leak infrastructure types.
- Run the repository's typecheck, lint, tests, and relevant build commands.
