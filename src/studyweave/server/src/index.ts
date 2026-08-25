import { app } from './app.js';
import { appConfig } from './common/config/app.config.js';
import { connectToDatabase } from './common/config/database.config.js';

const startServer = async (): Promise<void> => {
  try {
    await connectToDatabase();

    app.listen(appConfig.PORT, () => {
      const url = `http://localhost:${appConfig.PORT}`;

      console.log(`@ StudyWeave server listening at ${url}`);
    });
  } catch {
    console.error('# Failed to start the StudyWeave server.');
    process.exitCode = 1;
  }
};

void startServer();
