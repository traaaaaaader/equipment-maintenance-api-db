import { createApp } from './app.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { sequelize, waitForDatabase } from './db/sequelize.js';

async function main() {
  try {
    await waitForDatabase();
  } catch (err) {
    logger.fatal({ err }, 'Не удалось подключиться к базе данных при старте');
    process.exit(1);
  }

  const httpServer = createApp().listen(config.port, () => {
    logger.info({ port: config.port, env: config.nodeEnv }, 'Server started');
  });

  async function shutdown(signal: string) {
    logger.info({ signal }, 'Получен сигнал остановки, завершаю работу');
    httpServer.close(async () => {
      await sequelize.close();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  }

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => shutdown(signal));
  }

  function crash(reason: string, err: unknown) {
    logger.fatal({ err, reason }, 'shutting down');
    httpServer.close(() => process.exit(1));
    setTimeout(() => process.exit(1), 10_000).unref();
  }

  process.on('uncaughtException', (err) => crash('uncaughtException', err));
  process.on('unhandledRejection', (err) => crash('unhandledRejection', err));
}

main();
