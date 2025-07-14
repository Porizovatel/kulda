import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

let db: Database<sqlite3.Database, sqlite3.Statement> | null = null;

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/kulich.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const getDatabase = async (): Promise<Database<sqlite3.Database, sqlite3.Statement>> => {
  if (!db) {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    // Enable foreign keys
    await db.exec('PRAGMA foreign_keys = ON');
    await db.exec('PRAGMA journal_mode = WAL');
  }
  
  return db;
};

export const testConnection = async (): Promise<boolean> => {
  try {
    const database = await getDatabase();
    await database.get('SELECT 1');
    console.log('✅ Připojení k SQLite úspěšné');
    return true;
  } catch (error) {
    console.error('❌ Chyba připojení k SQLite:', error);
    return false;
  }
};

// Compatibility layer for MySQL-like queries
export const pool = {
  async execute(query: string, params: any[] = []): Promise<[any[], any]> {
    const database = await getDatabase();
    
    // Convert MySQL syntax to SQLite
    let sqliteQuery = query
      .replace(/AUTO_INCREMENT/gi, 'AUTOINCREMENT')
      .replace(/INT AUTO_INCREMENT/gi, 'INTEGER')
      .replace(/CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP/gi, 'CURRENT_TIMESTAMP')
      .replace(/ENUM\([^)]+\)/gi, 'TEXT')
      .replace(/TINYINT/gi, 'INTEGER')
      .replace(/DATETIME/gi, 'TEXT')
      .replace(/TIMESTAMP/gi, 'TEXT')
      .replace(/VARCHAR\(\d+\)/gi, 'TEXT')
      .replace(/TEXT NOT NULL UNIQUE/gi, 'TEXT UNIQUE NOT NULL');
    
    try {
      if (sqliteQuery.trim().toUpperCase().startsWith('INSERT')) {
        const result = await database.run(sqliteQuery, params);
        return [{ insertId: result.lastID, affectedRows: result.changes }, {}];
      } else if (sqliteQuery.trim().toUpperCase().startsWith('UPDATE') || 
                 sqliteQuery.trim().toUpperCase().startsWith('DELETE')) {
        const result = await database.run(sqliteQuery, params);
        return [{ affectedRows: result.changes }, {}];
      } else {
        const rows = await database.all(sqliteQuery, params);
        return [rows, {}];
      }
    } catch (error) {
      console.error('SQLite query error:', error);
      console.error('Query:', sqliteQuery);
      console.error('Params:', params);
      throw error;
    }
  }
};