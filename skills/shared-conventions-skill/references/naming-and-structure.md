# Shared naming and repository structure

## Contents

1. Suggested repository layout
2. Dependency boundaries
3. Naming table
4. Contract conventions

## 1. Suggested repository layout

For a monorepo, use independently buildable applications/services plus small shared packages:

```text
apps/
  web/
services/
  api-gateway/
  users-service/
packages/
  contracts/
  localization/
  config/
```

Do not share runtime framework objects through `packages`. Good shared packages contain stable DTOs/event schemas, resource keys, pure validation schemas when runtime-compatible, and carefully chosen configuration types.

If frontend and backend live in separate repositories, keep the same conceptual boundaries and publish or generate versioned contracts deliberately.

## 2. Dependency boundaries

- Frontend features may use public API DTOs but never MongoDB models or RabbitMQ delivery types.
- Backend domain/application code may use contracts but not frontend components or MUI types.
- A microservice must not import another service's internal module.
- `shared` means multiple real consumers, not merely code that might become reusable.
- Keep infrastructure adapters dependent on domain/application ports, not the reverse.

Avoid cyclic dependencies. If two features depend on each other's private code, move a genuinely neutral contract downward or reconsider the boundary.

## 3. Naming table

| Construct | Convention | Example |
| --- | --- | --- |
| React component/type/class | PascalCase | `UserCard`, `UserDto` |
| Function/variable/property | camelCase | `createUser`, `userId` |
| Hook | `use` + PascalCase words | `useUsers` |
| Boolean | `is`/`has`/`can`/`should` | `isApproved` |
| Fixed module constant | UPPER_SNAKE_CASE | `DEFAULT_PAGE_SIZE` |
| React component file | PascalCase `.tsx` | `UserCard.tsx` |
| Backend/module file | kebab-case + role | `user.repository.ts` |
| Test file | subject + `.test` | `user.service.test.ts` |
| HTTP path | lowercase plural nouns | `/users/:userId` |
| Event | past-tense dotted name + version | `user.registered.v1` |
| Resource key | feature.purpose.name | `users.actions.approve` |

Use `Dto` for transport data, `Document` only for persistence records, `Event` for immutable facts, `Command` for requested actions when that vocabulary helps, and `Props` for React component inputs.

## 4. Contract conventions

- Use ISO 8601 UTC strings at JSON boundaries and `Date` only inside code that has parsed and validated them.
- Use explicit units in names such as `timeoutMs`, `sizeBytes`, and `durationSeconds`.
- Use stable string status values rather than numeric enums.
- Version breaking API/event contracts.
- Distinguish absent, empty, and null values deliberately.
- Keep secrets, password hashes, internal IDs, stack traces, and infrastructure errors out of public DTOs.
