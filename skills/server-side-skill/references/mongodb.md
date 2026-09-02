# MongoDB Node.js driver conventions

## Contents

1. Required library and boundaries
2. Connection lifecycle
3. Typed documents and DTO mapping
4. Repository construction
5. Indexes and query design
6. Atomic updates and concurrency
7. Cursor pagination
8. Transactions and the outbox
9. Validation, errors, and tests

## 1. Required library and boundaries

Use the official MongoDB Node.js driver from the `mongodb` npm package for all application persistence:

```bash
npm install mongodb
```

Inspect `package.json` and the lockfile before writing code, and use APIs supported by the installed driver major version.

Do not introduce Mongoose or another ODM. Do not implement application queries, indexes, migrations, or seed behavior as `mongosh` snippets or raw JavaScript strings. Write typed TypeScript modules that call `MongoClient`, `Db`, and `Collection` methods from `mongodb`.

Keep driver types inside infrastructure and repository modules. Map `WithId<TDocument>` records to plain application DTOs before returning them to services or controllers.

## 2. Connection lifecycle

Create one `MongoClient` per service process, connect during bootstrap, reuse its built-in connection pool, and close it during graceful shutdown. Never construct or close a client for every request.

```ts
import { MongoClient } from 'mongodb';
import type { Collection, Db } from 'mongodb';

/**
 * Configure the MongoDB client and selected database.
 *
 * @property maxPoolSize - Maximum pooled connections. Defaults to `20`.
 * @property serverSelectionTimeoutMs - Maximum server-selection wait. Defaults to `5000` milliseconds.
 * @example
 * const config: MongoConfig = {
 *   uri: environment.mongoUri,
 *   databaseName: 'users-service',
 * };
 */
export type MongoConfig = Readonly<{
  uri: string;
  databaseName: string;
  maxPoolSize?: number;
  serverSelectionTimeoutMs?: number;
}>;

/**
 * Hold the connected driver objects shared by the service process.
 *
 * @example
 * const context = await createMongoContext(config);
 */
export type MongoContext = Readonly<{
  client: MongoClient;
  database: Db;
  users: Collection<UserDocument>;
}>;

/**
 * Connect one official MongoDB driver client and create typed collections.
 *
 * @param config - URI, database name, and optional pool settings.
 * @returns Connected driver objects for dependency construction.
 * @example
 * const mongo = await createMongoContext(mongoConfig);
 */
export const createMongoContext = async ({
  uri,
  databaseName,
  maxPoolSize = 20,
  serverSelectionTimeoutMs = 5_000,
}: MongoConfig): Promise<MongoContext> => {
  const client = new MongoClient(uri, {
    maxPoolSize,
    serverSelectionTimeoutMS: serverSelectionTimeoutMs,
  });

  await client.connect();

  const database = client.db(databaseName);
  const users = database.collection<UserDocument>('users');

  return { client, database, users };
};

/**
 * Close the process-wide MongoDB client during graceful shutdown.
 *
 * @param context - Connected context created during bootstrap.
 * @returns A promise that resolves after the pool closes.
 * @example
 * await closeMongoContext(mongo);
 */
export const closeMongoContext = async (
  context: MongoContext,
): Promise<void> => {
  await context.client.close();
};
```

Validate the URI, database name, timeouts, and pool sizes before calling the factory. Do not place credentials in code or logs.

## 3. Typed documents and DTO mapping

Model the persisted shape separately from the HTTP DTO. Omit `_id` from the schema type when the driver should generate it; read operations then return `WithId<UserDocument>`.

```ts
import type { WithId } from 'mongodb';

/**
 * Represent one user as stored in the service-owned collection.
 *
 * @example
 * const document: UserDocument = {
 *   id: crypto.randomUUID(),
 *   username: 'guy',
 *   passwordHash,
 *   isApproved: false,
 *   createdAt: new Date(),
 *   updatedAt: new Date(),
 * };
 */
export type UserDocument = Readonly<{
  id: string;
  username: string;
  passwordHash: string;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}>;

/**
 * Describe the document fields required to build a public user DTO.
 *
 * A full `WithId<UserDocument>` result and a matching driver projection both
 * satisfy this type.
 *
 * @example
 * const source: UserDtoSource = document;
 */
export type UserDtoSource = Readonly<
  Pick<WithId<UserDocument>, 'id' | 'username' | 'isApproved'>
>;

/**
 * Convert a driver result to a client-safe application DTO.
 *
 * @param document - Typed MongoDB result containing the generated `_id`.
 * @returns A DTO that excludes `_id` and `passwordHash`.
 * @example
 * const user = toUserDto(document);
 */
export const toUserDto = (
  document: UserDtoSource,
): UserDto => ({
  id: document.id,
  username: document.username,
  isApproved: document.isApproved,
});
```

Never expose password hashes, internal `_id` values, or other persistence-only fields accidentally. Do not serialize collection results directly from an Express controller.

## 4. Repository construction

Inject typed `Collection<TDocument>` objects into focused repository factories. Keep `MongoClient`, `Db`, `Collection`, `Filter`, `ClientSession`, and driver errors out of application-service contracts.

```ts
import type { Collection } from 'mongodb';

/**
 * Values required to create a persisted user.
 *
 * @example
 * const input: CreateUserRecord = {
 *   id: crypto.randomUUID(),
 *   username: 'guy',
 *   passwordHash,
 * };
 */
export type CreateUserRecord = Readonly<{
  id: string;
  username: string;
  passwordHash: string;
}>;

/**
 * Expose domain-specific persistence operations without driver types.
 *
 * @example
 * const repository = createUserRepository(users);
 */
export type UserRepository = Readonly<{
  findById: (userId: string) => Promise<UserDto | null>;
  create: (input: CreateUserRecord) => Promise<UserDto>;
}>;

/**
 * Create user persistence operations backed by a typed driver collection.
 *
 * @param users - `users` collection created once during bootstrap.
 * @returns Domain-specific repository operations.
 * @example
 * const repository = createUserRepository(mongo.users);
 */
export const createUserRepository = (
  users: Collection<UserDocument>,
): UserRepository => {
  /**
   * Find one user by its stable public identifier.
   *
   * @param userId - Public UUID used by application and API contracts.
   * @returns The safe user DTO, or `null` when no record matches.
   * @example
   * const user = await findById('user-123');
   */
  const findById = async (userId: string): Promise<UserDto | null> => {
    const document = await users.findOne({ id: userId });
    return document === null ? null : toUserDto(document);
  };

  /**
   * Insert one user with server-controlled defaults.
   *
   * @param input - Validated identifiers, username, and password hash.
   * @returns The inserted user without persistence-only fields.
   * @example
   * const user = await create(input);
   */
  const create = async (input: CreateUserRecord): Promise<UserDto> => {
    const now = new Date();
    const document: UserDocument = {
      ...input,
      isApproved: false,
      createdAt: now,
      updatedAt: now,
    };
    const result = await users.insertOne(document);

    return toUserDto({ ...document, _id: result.insertedId });
  };

  return { findById, create };
};
```

Prefer operation names such as `findUserByUsername`, `reserveInventory`, and `appendOrderItem` over generic CRUD names. Create a repository only when it provides a useful boundary; do not build a generic base repository.

## 5. Indexes and query design

Create indexes through the Node.js driver in an idempotent bootstrap or migration module. Derive each index from a real filter and sort shape.

```ts
import type { Collection } from 'mongodb';

/**
 * Ensure indexes required by user-service access patterns exist.
 *
 * @param users - Typed user collection.
 * @returns A promise that resolves after MongoDB creates or confirms the indexes.
 * @example
 * await ensureUserIndexes(mongo.users);
 */
export const ensureUserIndexes = async (
  users: Collection<UserDocument>,
): Promise<void> => {
  await users.createIndexes([
    {
      key: { id: 1 },
      unique: true,
      name: 'uq_users_id',
    },
    {
      key: { username: 1 },
      unique: true,
      name: 'uq_users_username',
    },
    {
      key: { isApproved: 1, createdAt: -1, id: -1 },
      name: 'ix_users_approval_created_at_id',
    },
  ]);
};
```

Use `collection.find`, `findOne`, `aggregate`, `countDocuments`, and other driver methods directly inside repositories. Use typed filter objects rather than JSON strings. Project only fields needed by the operation, and never return a projection as the full document type unless the selected fields actually satisfy it.

Use `cursor.explain('executionStats')` during investigation when a recurring query needs evidence. Do not run expensive explains on every production request.

## 6. Atomic updates and concurrency

Prefer one atomic driver update over read-modify-write. Include the expected state or version in the filter when concurrent writers could conflict.

```ts
import type { Collection, Filter, UpdateFilter } from 'mongodb';

/**
 * Mark an order paid only if it is currently pending.
 *
 * @param orders - Typed collection owned by the order service.
 * @param orderId - Stable public order identifier.
 * @returns `true` only when this invocation changed the order.
 * @example
 * const changed = await markOrderPaid(orders, 'order-123');
 */
export const markOrderPaid = async (
  orders: Collection<OrderDocument>,
  orderId: string,
): Promise<boolean> => {
  const filter: Filter<OrderDocument> = {
    id: orderId,
    status: 'pending',
  };
  const update: UpdateFilter<OrderDocument> = {
    $set: {
      status: 'paid',
      updatedAt: new Date(),
    },
  };
  const result = await orders.updateOne(filter, update);

  return result.modifiedCount === 1;
};
```

Use `$set`, `$inc`, `$push`, and `$addToSet` deliberately. Avoid `replaceOne` unless replacing the complete document is the intended operation.

## 7. Cursor pagination

Use cursor pagination for large or changing collections. Sort by a stable indexed field plus a unique tie-breaker, and fetch one extra record to determine whether another page exists.

```ts
import type { Collection, Filter } from 'mongodb';

/**
 * Identify the last record from the preceding page.
 *
 * @example
 * const cursor: UserPageCursor = {
 *   createdAt: '2026-09-02T12:00:00.000Z',
 *   id: 'user-123',
 * };
 */
export type UserPageCursor = Readonly<{
  createdAt: string;
  id: string;
}>;

/**
 * Return one page of users and an optional cursor for the next page.
 *
 * @property nextCursor - Last returned record when another page exists. Defaults to absent on the final page.
 * @example
 * const page = await listUsersPage(users, 25);
 */
export type UserPage = Readonly<{
  items: readonly UserDto[];
  nextCursor?: UserPageCursor;
}>;

/**
 * Load users with driver-based keyset pagination.
 *
 * @param users - Typed user collection.
 * @param pageSize - Maximum returned items. Defaults to `25`.
 * @param cursor - Previous page boundary. Defaults to absent for the first page.
 * @returns User DTOs and a cursor when another page exists.
 * @example
 * const firstPage = await listUsersPage(users);
 */
export const listUsersPage = async (
  users: Collection<UserDocument>,
  pageSize = 25,
  cursor?: UserPageCursor,
): Promise<UserPage> => {
  const filter: Filter<UserDocument> = cursor
    ? {
        $or: [
          { createdAt: { $lt: new Date(cursor.createdAt) } },
          {
            createdAt: new Date(cursor.createdAt),
            id: { $lt: cursor.id },
          },
        ],
      }
    : {};
  const documents = await users
    .find(filter, { projection: { passwordHash: 0 } })
    .sort({ createdAt: -1, id: -1 })
    .limit(pageSize + 1)
    .toArray();
  const hasNextPage = documents.length > pageSize;
  const pageDocuments = documents.slice(0, pageSize);
  const lastDocument = pageDocuments[pageDocuments.length - 1];
  const items = pageDocuments.map(toUserDto);

  return hasNextPage && lastDocument
    ? {
        items,
        nextCursor: {
          createdAt: lastDocument.createdAt.toISOString(),
          id: lastDocument.id,
        },
      }
    : { items };
};
```

Validate cursor contents and enforce a bounded page size at the HTTP boundary. Use offset pagination only for small administrative views that require arbitrary page jumps.

## 8. Transactions and the outbox

Use `MongoClient.startSession()` and `session.withTransaction()` only when multiple writes must commit atomically. MongoDB transactions require a replica set or supported sharded deployment.

```ts
import type { Collection, MongoClient } from 'mongodb';

/**
 * Save an order and its integration event in one MongoDB transaction.
 *
 * Generate identifiers and timestamps before calling this function because
 * the driver may retry the transaction callback.
 *
 * @param client - Process-wide connected MongoDB client.
 * @param orders - Typed order collection.
 * @param outboxEvents - Typed transactional outbox collection.
 * @param order - Complete order document with stable identifiers.
 * @param event - Complete outbox document with a stable event identifier.
 * @returns A promise that resolves after both writes commit.
 * @example
 * await saveOrderAndEvent(client, orders, outboxEvents, order, event);
 */
export const saveOrderAndEvent = async (
  client: MongoClient,
  orders: Collection<OrderDocument>,
  outboxEvents: Collection<OutboxDocument>,
  order: OrderDocument,
  event: OutboxDocument,
): Promise<void> => {
  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      await orders.insertOne(order, { session });
      await outboxEvents.insertOne(event, { session });
    });
  } finally {
    await session.endSession();
  }
};
```

Never call RabbitMQ, an HTTP service, or another external dependency from inside the transaction callback. Commit the local state and outbox record, then let a separate publisher deliver the event with confirms.

## 9. Validation, errors, and tests

- Validate HTTP and message input before repository calls. TypeScript types do not validate runtime JSON.
- Optionally create collection validators through `Db.createCollection` or a versioned driver-based migration module; keep application validation as well.
- Detect known driver failures with `MongoServerError` and stable properties such as the duplicate-key code. Map them to domain errors; never send raw driver errors to clients.
- Keep migrations and index creation idempotent and executable as TypeScript modules using the configured driver client.
- Unit-test application services with fake repository functions.
- Integration-test repositories against a real MongoDB-compatible instance using the same driver version as production.
- Use a replica-set-capable test deployment when testing transactions.
- Test unique indexes, cursor boundaries, atomic state filters, duplicate-key mapping, connection failure, and transaction rollback.
