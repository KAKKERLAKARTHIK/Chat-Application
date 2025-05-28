// server/src/db.js
import { Sequelize } from 'sequelize';
import dotenv         from 'dotenv';

dotenv.config();

export const sequelize = new Sequelize(
  process.env.DB_NAME,          // e.g. 'myapp'
  process.env.DB_USER,          // e.g. 'root'
  process.env.DB_PASS,          // e.g. 'password'
  {
    host:     process.env.DB_HOST,     // '127.0.0.1'
    port:     parseInt(process.env.DB_PORT, 10), // 3306
    dialect:  process.env.DB_DIALECT,         // 'mysql'
    logging:  console.log,                     // log SQL to console
    pool: {
      max:     5,
      min:     0,
      acquire: 30000,
      idle:    10000
    }
  }
);
