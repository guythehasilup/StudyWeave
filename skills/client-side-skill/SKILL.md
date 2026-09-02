---
name: build-react-mui-apps
description: Design, implement, refactor, or review React frontends written in TypeScript with Material UI using the Emotion engine and sx, React Hook Form, and TanStack Query hooks. Use for React components, pages, feature structure, MUI styling and theming, responsive or RTL layouts, forms and validation, API query and mutation hooks, loading/error/empty states, accessibility, frontend tests, or frontend architecture decisions in this stack.
---

# Build React MUI Apps

Build accessible, localized, feature-oriented React applications that follow MUI conventions and keep UI, form, client, and server state separate.

## Apply companion conventions

Apply `$apply-shared-code-conventions` alongside this skill for `const`-first TypeScript, function and type documentation, naming, resource keys, English/Hebrew parity, and the shared `translate` abstraction.

## Follow the frontend decision process

1. Inspect the existing React, MUI, TypeScript, React Hook Form, TanStack Query, routing, validation, and test versions before writing code.
2. Describe the user-visible behavior and all loading, empty, error, disabled, and success states.
3. Separate server state, form state, URL state, persistent client state, and local visual state. Put each value in the narrowest correct owner.
4. Choose the closest semantic MUI component and theme token before adding custom markup or CSS.
5. Define API DTOs, query keys, form values, defaults, and validation before composing the screen.
6. Implement the smallest useful component tree. Extract only reusable behavior, meaningful subviews, or independently testable logic.
7. Verify keyboard access, labels, directionality, responsive behavior, query invalidation, and form submission behavior.

## Enforce React and MUI rules

- Use function components and hooks. Use a class component only for a documented framework or legacy constraint with no practical function-based solution.
- Keep render functions pure. Put side effects in event handlers or narrowly scoped effects; never use an effect for a value that can be derived during render.
- Use MUI components before raw elements when MUI provides the semantic behavior: `Button`, `TextField`, `Typography`, `Stack`, `Box`, `Dialog`, `Table`, and related primitives.
- Use theme values for color, spacing, typography, radii, shadows, and breakpoints. Add a semantic theme token when the design needs a reusable value.
- Use `sx` for local, theme-aware styling. Use MUI `styled` for a reusable styled primitive. Do not use the HTML `style` prop or introduce another styling engine.
- Prefer logical CSS properties (`marginInlineStart`, `paddingInline`, `insetInlineEnd`) so English LTR and Hebrew RTL work without mirrored copies.
- Use React Hook Form as the owner of form values and field validation. Use `Controller` for controlled MUI components and `useFieldArray` for dynamic repeated fields.
- Use TanStack Query for remote server state. Do not copy query data into component state unless creating an intentional editable snapshot.
- Put queries and mutations in feature hooks with stable query-key factories. Invalidate or update the precise affected cache entries after mutations.
- Localize every user-facing string, including labels, placeholders, helper text, validation, ARIA labels, empty states, toasts, and dialog text.
- Use `React.memo`, `useMemo`, and `useCallback` only after identifying a real identity or rendering problem. Do not add them mechanically.

## Load detailed guidance as needed

- Read [react-mui.md](references/react-mui.md) for component boundaries, MUI-first composition, `sx`, theming, RTL, accessibility, and a complete component example.
- Read [forms-and-server-state.md](references/forms-and-server-state.md) whenever implementing React Hook Form, MUI field integration, TanStack Query queries or mutations, query keys, API clients, or state ownership.
- Read [frontend-structure.md](references/frontend-structure.md) for feature folders, filenames, public module APIs, testing placement, and dependency boundaries.

## Verify the result

- Confirm no class component exists without an explicit justification.
- Confirm the UI uses MUI semantics and theme tokens rather than ad hoc HTML and hard-coded styling.
- Confirm all product text is represented by typed resources in both English and Hebrew.
- Confirm form default values, validation, error display, disabled state, and submit behavior are explicit.
- Confirm every remote read/write uses TanStack Query conventions and stable keys.
- Confirm responsive layout, keyboard use, focus behavior, LTR, and RTL.
- Confirm generated functions, components, hooks, and complex types have the required documentation.
