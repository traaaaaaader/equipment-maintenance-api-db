require('dotenv/config');

const base = {
  username: process.env.PGUSER,
  password: process.env.PGPASSWORD || null,
  database: process.env.PGDATABASE,
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT) || 5432,
  dialect: 'postgres',
};

module.exports = {
  development: base,
  test: base,
  production: base,
};
