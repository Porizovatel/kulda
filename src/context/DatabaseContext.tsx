import React, { createContext, useContext, useEffect, useState } from 'react';
import { setupInfluxDB } from '../lib/influxdb';

interface DatabaseContextType {
  isLoaded: boolean;
  error: string | null;
}

const DatabaseContext = createContext<DatabaseContextType>({
  isLoaded: false,
  error: null
});

export const useDatabase = () => useContext(DatabaseContext);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initDb = async () => {
      try {
        await setupInfluxDB();
        setIsLoaded(true);
        setError(null);
      } catch (error: any) {
        console.error('Failed to initialize InfluxDB:', error);
        setError(error.message || 'Failed to connect to InfluxDB');
        // Retry connection after 5 seconds
        setTimeout(initDb, 5000);
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