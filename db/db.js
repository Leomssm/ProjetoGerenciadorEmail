import dotenv from 'dotenv';
dotenv.config();

import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
  throw new Error("A variável DATABASE_URL não está definida.");
}

console.log("DATABASE_URL em uso:", process.env.DATABASE_URL);

const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
});

export default sql;