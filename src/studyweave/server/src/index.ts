import { aiRequestPublisherService } from './ai/services/ai-request-publisher.service.js';
import { app } from './app.js';
import { appConfig } from './common/config/app.config.js';
import { connectToDatabase, disconnectFromDatabase } from './common/config/database.config.js';

let shutdownStarted = false;

const startServer = async (): Promise<void> => {
  try {
    await connectToDatabase();
    aiRequestPublisherService.start();

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
      await aiRequestPublisherService.stop();
      await disconnectFromDatabase();
    };

    process.once('SIGINT', () => {
      void shutdown();
    });

    process.once('SIGTERM', () => {
      void shutdown();
    });
  } catch {
    console.error('# Failed to start the StudyWeave server.');
    process.exitCode = 1;
  }
};

void startServer();
