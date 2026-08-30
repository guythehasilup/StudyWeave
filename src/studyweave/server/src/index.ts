import { aiResultConsumerService } from './ai/services/ai-result-consumer.service.js';
import { aiRequestPublisherService } from './ai/services/ai-request-publisher.service.js';
import { app } from './app.js';
import { appConfig } from './common/config/app.config.js';
import { connectToDatabase, disconnectFromDatabase } from './common/config/database.config.js';

let shutdownStarted = false;

const startServer = async (): Promise<void> => {
  try {
    await connectToDatabase();
    aiRequestPublisherService.start();
    aiResultConsumerService.start();

    const server = app.listen(appConfig.PORT, () => {
      const url = `http://localhost:${appConfig.PORT}`;

      console.log(`@ StudyWeave server listening at ${url}`);
    });

    const shutdown = async (): Promise<void> => {
      if (shutdownStarted) {
        return;
      }

      shutdownStarted = true;

      console.log('@ StudyWeave server is shutting down.');

      server.close();
      await aiResultConsumerService.stop();
      await aiRequestPublisherService.stop();
      await disconnectFromDatabase();
    };

    // SIGINT is normally emitted when a developer stops the process with Ctrl+C.
    process.once('SIGINT', () => {
      void shutdown();
    });

    // SIGTERM is normally emitted by process managers and container platforms.
    process.once('SIGTERM', () => {
      void shutdown();
    });
  } catch {
    console.error('# Failed to start the StudyWeave server.');
    process.exitCode = 1;
  }
};

void startServer();
