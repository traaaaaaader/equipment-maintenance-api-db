import { Sequelize } from 'sequelize';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export const sequelize = new Sequelize(config.db.database, config.db.user, config.db.password, {
  host: config.db.host,
  port: config.db.port,
  dialect: 'postgres',
  pool: config.db.pool,
  logging: config.isTest ? false : (sql) => logger.debug({ sql }, 'sql'),
});

export async function waitForDatabase({ attempts = 10, baseDelayMs = 500 } = {}): Promise<void> {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await sequelize.authenticate();
      return;
    } catch (err) {
      if (attempt === attempts) throw err;
      const delay = baseDelayMs * attempt;
      logger.warn({ attempt, attempts, delay }, 'База данных недоступна, повтор подключения');
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
