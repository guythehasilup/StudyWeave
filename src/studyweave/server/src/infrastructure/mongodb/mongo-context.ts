import { MongoClient } from 'mongodb';
import type { Collection } from 'mongodb';
import type { AppConfig } from '../../config/environment.js';
import type { UserDocument } from '../../modules/users/user.document.js';
import type { QuestionDocument } from '../../modules/questions/question.document.js';

/**
 * Hold the single MongoDB client and typed service-owned collections.
 *
 * @example
 * const mongo = await createMongoContext(config);
 */
export type MongoContext = Readonly<{
  client: MongoClient;
  users: Collection<UserDocument>;
  questions: Collection<QuestionDocument>;
}>;

/**
 * Connect one official MongoDB driver client for the service process.
 *
 * @param config - Validated connection, database, pool, and timeout settings.
 * @returns Connected driver objects and the typed users collection.
 * @throws {MongoServerError} When the server cannot establish a connection.
 * @example
 * const mongo = await createMongoContext(config);
 */
export const createMongoContext = async (config: AppConfig): Promise<MongoContext> => {
  const client = new MongoClient(config.mongodbUri, {
    maxPoolSize: config.mongodbMaxPoolSize,
    serverSelectionTimeoutMS: config.mongodbServerSelectionTimeoutMs,
  });

  await client.connect();

  const database = client.db(config.mongodbDatabase);
  const users = database.collection<UserDocument>('users');
  const questions = database.collection<QuestionDocument>('questions');

  return { client, users, questions };
};

/**
 * Close the process-wide MongoDB connection pool.
 *
 * @param context - Connected MongoDB context created during bootstrap.
 * @returns A promise that resolves after the pool closes.
 * @example
 * await closeMongoContext(mongo);
 */
export const closeMongoContext = async (context: MongoContext): Promise<void> => {
  await context.client.close();
};
