const { Pool } = require("pg");
require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production" || !!process.env.DATABASE_URL;

const pool = new Pool(
    process.env.DATABASE_URL
        ? {
              connectionString: process.env.DATABASE_URL,
              ssl: { rejectUnauthorized: false }
          }
        : {
              user: process.env.DB_USER,
              host: process.env.DB_HOST,
              database: process.env.DB_NAME,
              password: process.env.DB_PASSWORD,
              port: process.env.DB_PORT
          }
);

module.exports = pool;