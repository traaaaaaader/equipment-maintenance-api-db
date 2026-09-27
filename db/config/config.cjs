require('dotenv/config');

const base = {
  username: process.env.PGUSER,
  password: process.env.PGPASSWORD || null,
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT) || 5432,
  dialect: 'postgres',
};

module.exports = {
  development: { ...base, database: process.env.PGDATABASE },
  test: {
    ...base,
    database: process.env.PGDATABASE_TEST || `${process.env.PGDATABASE}_test`,
    logging: false,
  },
  production: { ...base, database: process.env.PGDATABASE },
};
