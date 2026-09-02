# Frontend structure and naming

## Contents

1. Feature-first structure
2. Dependency boundaries
3. File and symbol names
4. Testing placement

## 1. Feature-first structure

Use this as a starting point and adapt it to the repository:

```text
src/
  app/
    App.tsx
    providers/
    router/
    theme/
  features/
    users/
      api/
        users-api.ts
        user-query-keys.ts
      components/
        UserCard.tsx
      hooks/
        useUsers.ts
        useApproveUser.ts
      pages/
        UsersPage.tsx
      forms/
        user-form.types.ts
      users.types.ts
      index.ts
  shared/
    api/
    hooks/
    localization/
    ui/
  main.tsx
```

Create folders when they contain a real responsibility; do not create empty architecture layers. Keep related test files beside their subject unless the repository already uses a separate test tree.

## 2. Dependency boundaries

- `app` composes providers, routing, theme, and top-level behavior.
- `features` own user-facing business capabilities.
- `shared` contains capability-neutral code with demonstrated reuse.
- A feature may depend on `shared` but should not import another feature's private files.
- Expose a small feature public API from `index.ts` only when cross-feature imports are needed.
- Do not create one global `components`, `hooks`, or `utils` dumping ground.

## 3. File and symbol names

- React component files and exported component names: `PascalCase.tsx`, such as `UserCard.tsx`.
- Hooks: camel-case `use` names, such as `useUsers.ts` and `useApproveUser`.
- Non-component modules: kebab-case with a responsibility suffix, such as `users-api.ts`, `user-query-keys.ts`, and `user-form.types.ts`.
- Types: PascalCase; props end in `Props`, DTOs end in `Dto`, and form values end in `FormValues`.
- Event handlers: `handle` inside a component and `on` in props, such as `handleSubmit` and `onApprove`.
- Boolean values: start with `is`, `has`, `can`, or `should`.

Avoid meaningless names such as `data`, `item`, `helper`, and `utils` when a domain-specific name is available.

## 4. Testing placement

Test behavior rather than implementation details. Prefer accessible queries by role and label. Cover loading, empty, error, successful rendering, form validation, disabled submission, mutation success, and mutation failure.

Mock the network boundary rather than TanStack Query internals. Use a fresh query client per test to avoid cache leakage.
