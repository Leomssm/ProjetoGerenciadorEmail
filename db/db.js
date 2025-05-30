import postgres from 'postgres'
import dotenv from 'dotenv';
dotenv.config();


const sql = postgres({
  host: process.env.HOST,
  port: process.env.PG_PORT,
  database: process.env.DATABASE,
  username: process.env.USER,
  password: process.env.PASSWORD
});

export default sql