# Client Coding Conventions & Architecture Guidelines

This document defines the coding conventions, architectural boundaries, design rules, and workflow requirements for all client-side development in the project. All client changes must follow these guidelines.

---

## 1. Scope and Established Stack

The client application resides under:

```text
client/
```

Application source code belongs under:

```text
client/src/
```

The established frontend stack is:

- React.
- Vite.
- TypeScript in strict mode.
- Material UI (MUI).
- Emotion, including the RTL cache and Stylis RTL plugin.

Do not replace or introduce a frontend framework, router, state-management library, styling system, form library, or validation library without explaining the need and receiving explicit approval.

---

## 2. TypeScript Rules

- Write all application and configuration code in TypeScript.
- React files that contain JSX must end with `.tsx`.
- TypeScript files without JSX must end with `.ts`.
- Do not add `.js` or `.jsx` source files.
- Keep TypeScript strict mode enabled.
- Avoid `any`. Prefer a precise type, `unknown` with narrowing, or a generic constraint.
- Use `import type` when an import is used only by the type system.
- Do not use non-null assertions unless the invariant is guaranteed at the application boundary and cannot reasonably be represented in the type system.
- Do not weaken compiler or lint rules to bypass an implementation problem without approval.

### Type File Organization

- Store context-specific types inside a `types/` folder owned by that context or subcontext.
- Store types shared by multiple contexts under `client/src/common/types/`.
- Every project type file must end with `.type.ts`.
- Name type files after their precise responsibility, such as `auth-session.type.ts`, `register-form.type.ts`, or `route-definition.type.ts`.
- Do not declare reusable `type` aliases or `interface` declarations inside components, hooks, providers, services, or pages.
- Keep API request and response contracts explicit and separate from transient component state when their responsibilities differ.
- Do not place a context-specific type in `common`. Promote a type to `common/types/` only when it represents a genuinely shared contract.
- `vite-env.d.ts` is the only naming exception because it is a Vite ambient declaration file rather than a project type module.

---

## 3. Directory and Feature Structure

Use a context-first structure. Every business context, such as `auth` or `courses`, belongs directly under `client/src/`. Shared and cross-cutting code belongs under `client/src/common/`.

```text
client/src/
|-- auth/
|   |-- components/
|   |-- services/
|   |-- types/
|   |-- login/
|   |   |-- components/
|   |   |-- services/
|   |   |-- types/
|   |   `-- Login.page.tsx
|   `-- register/
|       |-- components/
|       |-- services/
|       |-- validators/
|       |-- types/
|       `-- Register.page.tsx
|-- courses/
|   `-- ...
|-- common/
|   |-- components/
|   |-- services/
|   |-- filters/
|   |-- hooks/
|   |-- mappers/
|   |-- providers/
|   |-- routing/
|   |-- resources/
|   |-- styles/
|   |-- theme/
|   |-- types/
|   `-- validators/
|-- App.component.tsx
`-- main.tsx
```

- Keep each business context at the top level of `client/src/`.
- Give every routed page its own subcontext beneath its owning context. For example, registration belongs at `auth/register/Register.page.tsx`, not in a global `pages/` directory.
- A page composes its subcontext and coordinates page behavior; it must not contain low-level API, storage, or broadly reusable UI implementations.
- Put code used only by one subcontext in that subcontext's focused folders, such as `auth/register/components/` or `auth/register/services/`.
- Put code shared by multiple subcontexts of the same context at the context level, such as `auth/components/`, `auth/services/`, or `auth/types/`.
- Put code shared by multiple top-level contexts under the corresponding `common/` folder, such as `common/components/`, `common/services/`, or `common/filters/`.
- Treat `common` as a deliberate cross-context boundary, not a miscellaneous dumping ground.
- Create only the folders a context currently needs; do not add empty placeholder directories.
- `common` must not import from a business context.
- A business context may import from `common` and from its own modules. A subcontext may also import its parent context's shared modules.
- Do not import a sibling subcontext's internal modules directly. Promote genuinely shared code to the parent context instead.
- Application composition modules, such as centralized routes, may import public page modules from multiple contexts.
- Do not create broad `utils/` or `helpers/` directories. Name and place reusable logic according to its responsibility.
- Keep modules small and focused. Split a file when it mixes rendering, network access, persistence, validation, and state orchestration.
- Avoid circular dependencies and avoid importing through a barrel file from within the same domain.

---

## 4. Naming and File Conventions

Every file must use the suffix that represents its responsibility:

- React components end with `.component.tsx`, such as `AuthLayout.component.tsx`.
- Routed pages end with `.page.tsx`, such as `Register.page.tsx`.
- Layout components end with `.layout.tsx`.
- Providers end with `.provider.tsx`.
- Hooks use camelCase names beginning with `use` and end with `.hook.ts`, such as `useRouter.hook.ts`.
- Context modules end with `.context.ts`.
- Service modules end with `.service.ts`.
- Filter modules end with `.filter.ts`.
- Storage modules end with `.storage.ts`.
- Mapper modules end with `.mapper.ts`.
- Validator modules end with `.validator.ts`, while schema-based validators may end with `.schema.ts`.
- Type modules end with `.type.ts`.
- Route-definition modules end with `.routes.ts`.
- Configuration modules end with `.config.ts`.
- Theme modules end with `.theme.ts`.
- Resource modules end with `.resource.ts`, such as `he.resource.ts`.
- Constant modules end with `.constant.ts`.
- Test modules end with `.test.ts` or `.test.tsx` according to whether they contain JSX.
- Components, pages, layouts, and providers use PascalCase filenames before the responsibility suffix.
- Services, filters, hooks, contexts, storage modules, mappers, validators, schemas, types, routes, configuration, themes, resources, and constants use descriptive camelCase or kebab-case consistently within their context.
- `main.tsx` and `vite-env.d.ts` are bootstrap/tooling exceptions to the responsibility suffix rule.
- Use clear English identifiers for files, variables, functions, types, and developer-facing diagnostics.
- Prefer named exports for application modules. The root `App.component.tsx` default export may remain where required by the established bootstrap pattern.

---

## 5. Imports and Readability

- Place all imports at the top of the file.
- Order imports consistently: third-party runtime imports, third-party type imports, internal runtime imports, then internal type imports.
- Remove unused imports and exports.
- Use semicolons.
- Add a blank line after every completed `const` declaration before the next declaration or statement.
- Format every ternary expression across separate lines, with the `?` and `:` branches on their own lines. Do not keep `condition ? valueA : valueB` on one line.
- Prefer early returns over deeply nested conditionals.
- Use descriptive names rather than abbreviations.
- Do not use nested ternary expressions for control flow.
- Run Prettier instead of manually aligning code.

---

## 6. Components and Hooks

- Use function components and React hooks.
- Keep components focused on one responsibility.
- Extract a reusable component when behavior, accessibility, or styling would otherwise be duplicated.
- Avoid `useEffect` whenever the value can be derived during rendering, initialized lazily in state, or updated directly by an event handler.
- Use `useEffect` only to synchronize React with an external system, such as browser events, timers, subscriptions, imperative APIs, or external data lifecycles that cannot be handled by an explicit user action.
- Do not use `useEffect` to mirror props or state, compute derived values, or coordinate logic that belongs in an event handler or service.
- Keep necessary side effects inside `useEffect` or a dedicated service, depending on whether the effect belongs to the rendering lifecycle or application behavior.
- Clean up event listeners, timers, subscriptions, and pending work created by effects.
- Memoize context values and stable callbacks when they are supplied to consumers and would otherwise cause unnecessary rerenders.
- Do not add memoization without a concrete stability or performance reason.
- Custom hooks must validate required provider context and fail with a clear developer-facing error sourced from the resource file when displayed or exposed through the client.

### Component Body Order

Keep every component body in this order:

1. React hooks and React-owned values at the top, including context, state, refs, and necessary effects.
2. Derived values and local constants.
3. Event handlers and other component logic.
4. A single JSX `return` at the end of the component.

- Do not place hooks after derived logic, handlers, conditions, or early returns.
- Do not place executable component logic after the final JSX `return`.
- Extract substantial non-React business logic into an appropriately named service, validator, filter, or mapper.

---

## 7. State Management

- Keep state as close as possible to the components that use it.
- Use local component state for local UI behavior.
- Use a React provider for state shared by a bounded route group or feature.
- Scope providers through route layouts or feature boundaries. Do not mount a feature provider globally when unrelated pages do not use it.
- Preserve authentication form state in memory while navigating between login and registration.
- Clear authentication form state on a full page refresh by keeping it out of persistent browser storage.
- Do not introduce global state management without approval and a demonstrated cross-feature need.
- Do not duplicate server state in multiple providers. Define one owner and an explicit invalidation or refresh strategy.

---

## 8. Routing

- Keep application route definitions centralized in `common/routing/app.routes.ts`.
- Every route definition must specify its path, page component, title, and layout.
- Use a dedicated fallback route for unknown paths.
- Keep shared routing responsibilities under `common/routing/`, separated into `components/`, `hooks/`, `providers/`, `services/`, and `types/` as needed.
- Use the routing service and `NavigationLink` for internal navigation rather than ad hoc URL conditionals.
- Preserve standard browser behavior for modified clicks, non-primary clicks, history navigation, and direct URLs.
- Route-scoped providers belong in route layouts, not in page components or the global bootstrap unless every page needs them.
- Adding a third-party router requires prior approval and a migration plan for the current route contracts.

---

## 9. Hebrew, RTL, and Resources

- The user interface language is Hebrew.
- Set `lang="he"` and `dir="rtl"` at the document level.
- Keep MUI direction, Emotion RTL processing, and document direction aligned.
- Store all user-visible Hebrew text in `client/src/common/resources/he.resource.ts`.
- Do not hardcode Hebrew text in components, pages, hooks, services, validation logic, accessibility labels, titles, loading states, or error messages.
- Group resource entries by feature or concern and use descriptive keys.
- Keep code identifiers, developer comments, and developer-facing console output in English.
- Use CSS logical properties such as `margin-inline-start` instead of left/right properties when direction matters.
- Verify layout and punctuation visually in RTL after changing text or layout.

---

## 10. Design System and Styling

Use the established “המכלול” visual language:

- Default dark theme.
- Main canvas: `#0B1020`.
- Surface/card: `#141D33`.
- Elevated surface: `#1B2742`.
- Primary purple: `#7557F6`.
- Arial as the single application font.
- An 8-point spacing system.
- Rounded cards and controls.
- Generous spacing suitable for Hebrew text.
- Responsive desktop and mobile layouts.
- Accessible contrast and clear focus indicators.

Additional styling rules:

- Prefer existing MUI components over raw HTML controls when an appropriate MUI component exists.
- Define shared colors, typography, spacing, shape, and component overrides in the MUI theme.
- Prefer theme tokens over repeated color, spacing, radius, or typography literals.
- Use the `sx` prop for component-scoped styling.
- Keep `common/styles/global.css` limited to true global styles, document backgrounds, reusable global decoration, and browser-level behavior.
- Do not add a second CSS framework or CSS-in-JS system without approval.
- Respect `prefers-reduced-motion` for nonessential animation.
- Do not convey state or validation using color alone.

---

## 11. Accessibility

- Use semantic landmarks and elements where possible.
- Associate every form control with a visible label.
- Give controls stable and unique IDs and appropriate `name` and `autocomplete` attributes.
- Ensure all functionality is available by keyboard.
- Provide visible focus indicators with sufficient contrast.
- Icon-only buttons require localized accessible names.
- Stateful controls must expose their state, such as `aria-pressed` for password visibility.
- Decorative images and elements must be hidden from assistive technology.
- Loading and success messages should use an appropriate live-region role when users need to be notified.
- Keep disabled, hover, focus, loading, success, and error states understandable and visually distinct.
- Preserve a logical heading hierarchy and reference headings with `aria-labelledby` where appropriate.

---

## 12. Forms and Validation

- Validate required fields and formatting in the client for immediate feedback.
- Treat server validation as authoritative; client validation must not be considered a security boundary.
- Keep normalization rules aligned with the server, especially username trimming and lowercasing.
- Show field errors live after a field becomes touched, and remove the error as soon as the current value becomes valid.
- On submit, mark all relevant fields as touched and stop before the request when validation fails.
- Display password requirement hints only when the password field has a validation error.
- Disable submission while a request is running to prevent duplicate requests.
- Show localized loading text and an accessible progress indicator.
- Preserve entered values after a failed request unless there is an explicit security or product reason to clear them.
- Use a generic localized authentication error for unknown usernames and incorrect passwords.
- Never include a plaintext password in logs, errors, URLs, analytics, or persistent storage.

---

## 13. API and Service Boundaries

- Keep network requests in dedicated client or service modules, never directly in presentation components.
- Read the API base URL from `import.meta.env.VITE_API_URL`.
- Validate HTTP status before trusting a response.
- Parse error payloads defensively because non-success responses may not contain valid JSON.
- Keep request and response contracts typed.
- Do not expose raw server errors directly to users. Map them to safe localized resource messages.
- Keep API endpoint construction centralized by feature to avoid duplicated URL fragments.
- Any server-contract change that affects request bodies, response bodies, authentication headers, or status handling requires coordination and approval before changing the client.

---

## 14. Authentication and Browser Storage

- Store the JWT access token in `sessionStorage` only.
- Do not store authentication tokens in `localStorage` or cookies unless the authentication strategy is explicitly reconsidered and approved.
- Send the access token using the `Authorization: Bearer <token>` header.
- Clear legacy or stale tokens from both storage locations during migration or logout where needed.
- Never log tokens, passwords, authorization headers, or complete authentication payloads.
- Do not decode a JWT and treat its contents as trusted authorization. The server remains authoritative.
- Clear the token when the session is explicitly ended or the authentication state is no longer valid.
- Treat XSS prevention as critical because JavaScript can access `sessionStorage`: avoid unsafe HTML rendering and untrusted script injection.

---

## 15. Environment Variables and Secrets

- Access client environment variables only through `import.meta.env`.
- Client variables exposed by Vite must use the `VITE_` prefix.
- Assume every `VITE_` variable is public and visible in the browser bundle.
- Never put secrets, private keys, database credentials, signing keys, or privileged tokens in client environment files.
- Keep a safe `.env.example` with placeholder values only.
- Do not commit the real `.env` file.
- Add a typed Vite environment declaration when new variables are introduced.
- Fail clearly during development when a required configuration value is missing or invalid.

---

## 16. Assets

- Keep static public assets under `client/assets/` unless the build requires imported source assets.
- Reuse the established application logo and theme assets.
- Optimize SVGs and images without removing accessibility-relevant behavior.
- Decorative images use an empty alternative text; meaningful images require localized alternative text from the resource file.
- Do not embed large binary assets directly in source modules.

---

## 17. Dependencies and Security

- Prefer the installed framework, MUI components, browser APIs, and small local modules before adding a dependency.
- Explain the purpose, maintenance impact, bundle impact, and alternatives before adding a runtime dependency.
- Receive approval before adding or replacing a framework, state manager, router, form library, validation library, analytics SDK, or authentication SDK.
- Keep `package-lock.json` synchronized with `package.json`.
- Do not use `dangerouslySetInnerHTML` with untrusted content.
- Do not expose sensitive values in logs or user-facing errors.
- Avoid open redirects by normalizing and constraining internal navigation targets.

---

## 18. Verification

Before considering a client implementation complete, run the checks relevant to the change:

```text
npm run format
npm run lint
npm run build
npm run format:check
```

- The production build must pass TypeScript checking and Vite bundling.
- Lint and formatting checks must pass without ignoring new errors.
- Verify changed pages at mobile and desktop widths.
- Verify keyboard interaction, focus behavior, RTL layout, loading states, and validation states when those areas change.
- When a test framework is introduced with approval, add focused tests for validation, routing, storage, and service behavior rather than relying only on manual checks.
- Do not claim verification that was not actually performed.

---

## 19. Governance and Approval Protocol

Explicit approval is required before:

1. Replacing or introducing a framework, router, state manager, design system, form system, or test framework.
2. Adding a runtime dependency with meaningful bundle, security, or maintenance impact.
3. Changing the authentication or token-storage strategy.
4. Changing API contracts or behavior in a way that requires server changes.
5. Reorganizing major directories, changing architectural boundaries, or introducing shared global providers.
6. Changing the established Hebrew-only, RTL, dark-theme, MUI, or Arial requirements.

Before requesting approval, explain the reason, exact structural or behavioral impact, alternatives considered, migration needs, and likely risks. Do not implement unrelated features as part of an approved change.
