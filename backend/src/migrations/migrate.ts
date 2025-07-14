import fs from 'fs';
import path from 'path';
import { getDatabase } from '../config/database';

const runMigrations = async () => {
  try {
    console.log('🚀 Spouštím migrace databáze...');
    
    const migrationFile = path.join(__dirname, '001_initial_schema.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    const db = await getDatabase();
    
    // Rozdělení SQL na jednotlivé příkazy
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        await db.exec(statement);
      }
    }
    
    console.log('✅ Migrace dokončeny úspěšně');
    process.exit(0);
  } catch (error) {
    console.error('❌ Chyba při migraci:', error);
    process.exit(1);
  }
};

runMigrations();