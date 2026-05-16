import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USER     || 'root',
  password: process.env.DB_PASS     || '',
  database: process.env.DB_NAME     || 'erpgest',
  sync:     process.env.DB_SYNC     === 'true',
  logging:  process.env.DB_LOGGING  === 'true',
}));
