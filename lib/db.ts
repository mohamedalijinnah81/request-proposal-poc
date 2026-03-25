import mysql from "mysql2/promise";

type SQLParam = string | number | boolean | Date | null;

const dbConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false,
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

export async function query<T = unknown>(
  sql: string,
  params?: SQLParam[]
): Promise<T[]> {
  const connection = getPool();
  const [rows] = await connection.execute(sql, params);
  return rows as T[];
}

export async function queryOne<T = unknown>(
  sql: string,
  params?: SQLParam[]
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export async function execute(
  sql: string,
  params?: SQLParam[]
): Promise<mysql.ResultSetHeader> {
  const connection = getPool();
  const [result] = await connection.execute(sql, params);
  return result as mysql.ResultSetHeader;
}