import { useState, useEffect, useCallback } from 'react';
import { testDbConnection } from '../services/api';

const STORAGE_KEY = 'sql_visualizer_db_config';

export interface DatabaseConfig {
  host?: string;
  port?: string;
  user?: string;
  password?: string;
  database?: string;
  type: 'postgres' | 'mysql';
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

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
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  const checkConnection = useCallback(async (cfg: DatabaseConfig) => {
    if (!cfg.host || !cfg.database || !cfg.user) {
      setStatus('disconnected');
      setErrorMessage(undefined);
      return;
    }

    setStatus('connecting');
    try {
      await testDbConnection(cfg);
      setStatus('connected');
      setErrorMessage(undefined);
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error?.error || String(error));
    }
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setConfigState(parsed);
        checkConnection(parsed);
      } else {
        checkConnection(defaultConfig);
      }
    } catch (error) {
      console.error('Failed to load DB config', error);
    }
  }, [checkConnection]);

  const setConfig = useCallback((newConfig: DatabaseConfig) => {
    setConfigState(newConfig);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    } catch (error) {
      console.error('Failed to save DB config', error);
    }
    checkConnection(newConfig);
  }, [checkConnection]);

  return { config, setConfig, status, errorMessage, checkConnection };
};
