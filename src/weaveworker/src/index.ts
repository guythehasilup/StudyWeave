import { appConfig } from './common/config/app.config.js';
import { connectToDatabase, disconnectFromDatabase } from './common/config/database.config.js';
import { weaveLogic } from './weave/weave.logic.js';

let stopping = false;

let shutdownStarted = false;

const startWorker = async (): Promise<void> => {
  await connectToDatabase();

  console.log('@ WeaveWorker connected to MongoDB.');

  while (!stopping) {
    try {
      await weaveLogic.run();
    } catch {
      console.error('# WeaveWorker lost its RabbitMQ connection.');
    }

    if (!stopping) {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, appConfig.RABBITMQ_RECONNECT_DELAY_MS);
      });
    }
  }
};

const shutdown = async (): Promise<void> => {
  if (shutdownStarted) {
    return;
  }

  shutdownStarted = true;
  stopping = true;

  console.log('@ WeaveWorker is shutting down.');

  await weaveLogic.stop();
  await disconnectFromDatabase();
};

process.once('SIGINT', () => {
  void shutdown();
});

process.once('SIGTERM', () => {
  void shutdown();
});

void startWorker().catch(() => {
  console.error('# WeaveWorker failed to start.');
  process.exitCode = 1;
});
