const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

// Enforce dotenv config loading if not already loaded
if (!process.env.DATABASE_URL) {
  require('dotenv').config();
}

const dbUrl = new URL(process.env.DATABASE_URL);
const adapter = new PrismaMariaDb({
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port || '3306'),
  user: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname.substring(1),
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
  allowPublicKeyRetrieval: true,
});

const prisma = new PrismaClient({ adapter });

module.exports = prisma;
