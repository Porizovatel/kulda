import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'kulich_user',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kulich_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

export const pool = mysql.createPool(dbConfig);

export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Připojení k MariaDB úspěšné');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Chyba připojení k MariaDB:', error);
    return false;
  }
};