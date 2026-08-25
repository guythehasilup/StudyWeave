# Server Coding Conventions & Architecture Guidelines

This document outlines the standard coding conventions, architectural structure, and workflow rules for server-side development within the project. All server modifications must strictly adhere to these guidelines.

---

## 1. Directory & Context Structure

All server-side code resides strictly under the root path:

```
server/src/
```

### Context-Based Separation

- Code must be organized logically by domain/context.
- Contexts that contain controllers or logic components belong directly under `server/src/` (e.g., `server/src/auth/` or `server/src/orders/`).
- A context that contains only `types/`, `models/`, `validators/`, and/or `mappers/`, with no controller or logic layer, must reside under `server/src/infra/<context>/`.
- Infrastructure-only contexts must retain their own responsibility folders, such as `server/src/infra/users/models/` and `server/src/infra/users/types/`.
- `infra` must not import from controller/logic contexts. Controller/logic contexts may import infrastructure models, types, validators, and mappers.
- If an infrastructure-only context later gains a controller or logic layer, present the structural impact and receive approval before moving it from `infra/` to the top level.
- Shared base classes, interfaces, and cross-cutting utilities must reside in a dedicated common core directory (e.g., `server/src/common/` or `server/src/core/`).

---

## 2. Architectural Pattern (Modified MVC)

We adhere to a streamlined **Controller-Logic** pattern without a repository layer:

- **Routes Layer (`*.routes.ts`)**: Defines HTTP paths, verbs, and connects validation middleware directly to controller handlers.
- **Controller Layer (`*.controller.ts`)**: Handles incoming HTTP requests, extracts parameters, formats HTTP responses, and delegates execution to the logic layer.
- **Logic / Service Layer (`*.logic.ts`)**: Contains business rules, data fetching/manipulation, orchestration, and communication directly with models or external services.
- **Repository Layer**: **Do not create explicit repository classes.** Logic components interact directly with database models or the ORM/ODM instance.

---

## 3. Models

- **Location**: All database models must be placed in a `models/` directory within their respective top-level or `infra` context (or shared core directory if globally accessible).
- **Naming & Extension**: Every model file must end with `.model.ts` (e.g., `user.model.ts`, `product.model.ts`).
- **Conventions**:
  - Extend a standard base model (e.g., `BaseModel`).
  - Follow standard Node.js ORM/ODM practices (e.g., Mongoose schemas, TypeORM/Prisma entities, or raw TS interfaces).
  - Explicitly define TypeScript interfaces for documents/entities alongside schemas.

### Development-Stage Model Changes

- The project is currently in an early development stage and local database documents are disposable.
- Approved architecture or feature work may modify existing model schemas without preserving compatibility with current local documents.
- Do not retain obsolete fields or add compatibility code solely to migrate existing development documents unless explicitly requested.
- The developer is responsible for clearing or recreating local documents after an approved incompatible model change.
- Continue to flag model changes that affect API contracts, client behavior, production data, indexes, security, or authentication before implementation.

---

## 4. View Models & Types

- **Location**: Place view models (DTOs / Request & Response types) inside the specific context directory where they are used.
- **Naming & Extension**: Every view model file must end with `.type.ts` (e.g., `create-user-request.type.ts`, `user-response.type.ts`).
- **Context Isolation & Duplication Rule**:
  - **Do NOT reuse view models across different controllers/contexts**, even if the underlying data or properties are identical.
  - Prefix/name each view model based on the context of the controller itself.
  - **Duplicate the type definition** per context to maintain clean decoupling, API immutability, and prevent cascading breaks when one context's requirements change.

---

## 5. Mappers

- **Location**: Place mapping logic inside a `mappers/` sub-folder within the context directory (e.g., `server/src/infra/users/mappers/` for an infrastructure-only context).
- **Naming & Extension**: Mapper files must end with `.mapper.ts` (e.g., `user.mapper.ts`).
- **Responsibility**:
  - Map database models (`*.model.ts`) to View Models / DTOs (`*.type.ts`), and vice-versa.
  - Implement base mapper interfaces/classes to enforce standard mapping contracts (`toViewModel()`, `toModel()`, `toResponseList()`).

---

## 6. Input Validation & Schemas

- **Location**: Place input validation schemas or middleware inside a `validators/` sub-folder within the context directory.
- **Naming & Extension**: Every validator file must end with `.validator.ts` or `.schema.ts` (e.g., `user-input.schema.ts`).
- **Responsibility**:
  - Validate incoming `req.body`, `req.query`, and `req.params` before execution reaches the controller or logic layer.
  - Reject invalid requests early with standardized validation error structures.

---

## 7. Centralized Error Handling & Domain Exceptions

- Do not handle generic standard HTTP error responses inside individual logic components.
- Custom business logic exceptions must extend a `BaseError` or `CustomException` class located in `server/src/common/errors/`.
- All errors are caught and transformed by a centralized error-handling middleware into standard JSON error responses.

---

## 8. Configuration & Environment Management

- **Rule**: Never access `process.env` directly inside logic files, controllers, or mappers.
- **Convention**: Define typed configuration objects/classes under `server/src/common/config/` (e.g., `db.config.ts`, `app.config.ts`).
- Import or inject these typed configuration abstractions into your logic layer to guarantee fail-fast behavior on startup.

---

## 9. Base Classes & Abstractions

To ensure consistency, reduce boilerplate, and enforce uniform structure, create and extend base classes for all major architectural components:

1. **`BaseController`**: Standardizes error catching, response wrapping, and pagination helpers.
2. **`BaseLogic`**: Standardizes execution flows, logger injection, and event dispatching.
3. **`BaseModel`**: Defines common database fields (`id`, `createdAt`, `updatedAt`, `isDeleted`).
4. **`BaseMapper<TModel, TViewModel>`**: Defines contracts for mapping bidirectionally between models and view models.
5. **`BaseViewModel`**: Defines base properties for response DTOs.
6. **`BaseError`**: Defines standard error structure for custom domain exceptions.

---

## 10. Folder Structure Reference Example

Here is an example layout containing shared code, an infrastructure-only `users` context, and an executable `orders` context:

```
server/src/
|-- common/
|   |-- config/
|   |   `-- app.config.ts
|   |-- controllers/
|   |   `-- base.controller.ts
|   |-- errors/
|   |   `-- base.error.ts
|   |-- logic/
|   |   `-- base.logic.ts
|   |-- models/
|   |   `-- base.model.ts
|   |-- mappers/
|   |   `-- base.mapper.ts
|   `-- types/
|       `-- base-view-model.type.ts
|-- infra/
|   `-- users/
|       |-- models/
|       |   `-- user.model.ts
|       |-- mappers/
|       |   `-- user.mapper.ts
|       |-- types/
|       |   `-- user.type.ts
|       `-- validators/
|           `-- user.schema.ts
`-- orders/
    |-- models/
    |   `-- order.model.ts
    |-- mappers/
    |   `-- order.mapper.ts
    |-- validators/
    |   `-- order.schema.ts
    |-- types/
    |   |-- create-order-request.type.ts
    |   `-- order-response.type.ts
    |-- order.routes.ts
    |-- order.controller.ts
    `-- order.logic.ts
```

---

## 11. Code Readability and Formatting

- Use semicolons.
- Add a blank line after every completed `const` declaration before the next declaration or statement.
- Format every ternary expression across separate lines, with the `?` and `:` branches on their own lines. Do not keep `condition ? valueA : valueB` on one line.
- Do not use nested ternary expressions for control flow.
- Prefer early returns over deeply nested conditions.
- Keep imports at the top of the file and remove unused imports and exports.
- Keep functions and classes focused on one architectural responsibility.
- Use descriptive English names for files, types, variables, functions, and developer-facing logs.
- Run Prettier instead of manually aligning code.

---

## 12. Governance & Approval Protocol

To maintain code quality and prevent unintended side effects, strict approval protocols must be followed:

1. **Server Architecture Changes**:
   - Any modification involving structural changes, new architectural patterns, core abstractions, base class updates, or project re-organization **requires explicit reasoning and developer approval**.
   - Before implementing, present:
     - The reasoning/thinking process behind the architectural shift.
     - The exact structural impact.
     - Potential risks or migration steps.

2. **Client-Impacting Changes**:
   - Any modification on the server that impacts client interaction (e.g., altering API payloads, status codes, breaking endpoints, websocket contracts, or frontend state requirements) **MUST be explicitly flagged and approved prior to implementation**.
