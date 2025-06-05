import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../data/db';

interface DatabaseContextType {
  isLoaded: boolean;
  error: string | null;
}

const DatabaseContext = createContext<DatabaseContextType>({
  isLoaded: false,
  error: null
});

export const useDatabase = () => useContext(DatabaseContext);

export const InfluxDatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initDb = async () => {
      try {
        // Initialize local IndexedDB database
        await db.open();
        setIsLoaded(true);
        setError(null);
      } catch (error: any) {
        console.error('Failed to initialize database:', error);
        setError(error.message || 'Failed to initialize database');
      }
    };

    initDb();
  }, []);

  return (
    <DatabaseContext.Provider value={{ isLoaded, error }}>
      {children}
    </DatabaseContext.Provider>
  );
};