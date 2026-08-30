# Weave.CONTRACT

`Weave.CONTRACT` is the shared TypeScript wire-contract package for StudyWeave and WeaveWorker.
It is the single source of truth for versioned RabbitMQ message types, validation schemas,
JSON/buffer mappers, broker endpoint topology, and the durable invalid-message quarantine endpoint.

The package deliberately does not contain HTTP request types, MongoDB documents, worker outbox
models, OpenAI provider types, business logic, or RabbitMQ connection management. Those concerns
remain owned by the process that uses them.

## Local setup

Install all service-workspace dependencies from the repository root:

```powershell
cd C:\studyweave\StudyWeave
npm install
npm run build
```

The root build compiles the contract, server, and worker in workspace order. While editing contract
source, use `npm run dev:contract` in a separate terminal so its generated package output stays
current.

For a production dependency tree, build before removing development dependencies:

```powershell
npm ci
npm run build
npm prune --omit=dev
```

Deploy the workspace root so the server and worker retain their link to the compiled contract
package; do not copy either service folder without `Weave.CONTRACT`.

## Compatibility

Every message body carries a literal `version`, and every RabbitMQ publication carries a versioned
`type` property. Breaking wire-format changes require a new message version and matching versioned
RabbitMQ endpoint rather than changing an active contract in place.
