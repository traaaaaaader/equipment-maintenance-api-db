import { createApp } from './app.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';

const httpServer = createApp().listen(config.port, () => {
  logger.info({ port: config.port, env: config.nodeEnv }, 'Server started');
});

function shutdown(reason: string, err: unknown) {
  logger.fatal({ err, reason }, 'shutting down');
  httpServer.close(() => process.exit(1));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('uncaughtException', (err) => shutdown('uncaughtException', err));
process.on('unhandledRejection', (err) => shutdown('unhandledRejection', err));
