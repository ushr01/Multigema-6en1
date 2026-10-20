import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { pool } from './db.js';
const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
await pool.query(
  `INSERT INTO users (name,email,password_hash,role) VALUES ('Admin',?,?,'admin') ON DUPLICATE KEY UPDATE role='admin'`,
  [ADMIN_EMAIL, await bcrypt.hash(ADMIN_PASSWORD, 12)]);
console.log('Admin creado:', ADMIN_EMAIL);
process.exit(0);
