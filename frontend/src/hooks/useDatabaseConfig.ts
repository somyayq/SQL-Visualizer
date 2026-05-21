import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'sql_visualizer_db_config';

export interface DatabaseConfig {
  host?: string;
  port?: string;
  user?: string;
  password?: string;
  database?: string;
  type: 'postgres' | 'mysql';
}

const defaultConfig: DatabaseConfig = {
  host: 'localhost',
  port: '5432',
  user: 'postgres',
  password: '',
  database: 'postgres',
  type: 'postgres'
};

export const useDatabaseConfig = () => {
  const [config, setConfigState] = useState<DatabaseConfig>(defaultConfig);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setConfigState(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load DB config', error);
    }
  }, []);

  const setConfig = useCallback((newConfig: DatabaseConfig) => {
    setConfigState(newConfig);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    } catch (error) {
      console.error('Failed to save DB config', error);
    }
  }, []);

  return { config, setConfig };
};
