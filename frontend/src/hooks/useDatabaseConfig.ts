import { useState, useEffect, useCallback } from 'react';
import { testDbConnection } from '../services/api';

const STORAGE_KEY = 'sql_visualizer_db_config';

export interface DatabaseConfig {
  id?: string;
  name?: string;
  host?: string;
  port?: string;
  user?: string;
  password?: string;
  database?: string;
  type: 'postgres' | 'mysql';
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

const defaultConfig: DatabaseConfig = {
  id: 'default',
  name: 'Default Connection',
  host: 'localhost',
  port: '5432',
  user: 'postgres',
  password: '',
  database: 'postgres',
  type: 'postgres'
};

const SAVED_CONFIGS_KEY = 'sql_visualizer_saved_configs';

export const useDatabaseConfig = () => {
  const [config, setConfigState] = useState<DatabaseConfig>(defaultConfig);
  const [savedConfigs, setSavedConfigs] = useState<DatabaseConfig[]>([]);
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
      let msg = 'Connection failed';
      if (error?.message) msg = error.message;
      else if (error?.error) msg = error.error;
      else if (typeof error === 'string') msg = error;
      else if (error instanceof Error) msg = error.message;
      else if (typeof error === 'object') msg = JSON.stringify(error);
      setErrorMessage(msg);
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
      
      const storedConfigs = localStorage.getItem(SAVED_CONFIGS_KEY);
      if (storedConfigs) {
        setSavedConfigs(JSON.parse(storedConfigs));
      } else if (stored) {
        const parsed = JSON.parse(stored);
        if (!parsed.id) parsed.id = 'default';
        if (!parsed.name) parsed.name = 'Default Connection';
        setSavedConfigs([parsed]);
      } else {
        setSavedConfigs([defaultConfig]);
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

  const saveConfig = useCallback((newConfig: DatabaseConfig) => {
    let configToSave = { ...newConfig };
    if (!configToSave.id) {
      configToSave.id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
    }
    if (!configToSave.name) {
      configToSave.name = `${configToSave.database} on ${configToSave.host}`;
    }

    setSavedConfigs(prev => {
      const updated = prev.some(c => c.id === configToSave.id)
        ? prev.map(c => c.id === configToSave.id ? configToSave : c)
        : [...prev, configToSave];
      try {
        localStorage.setItem(SAVED_CONFIGS_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save saved configs', error);
      }
      return updated;
    });

    setConfig(configToSave);
  }, [setConfig]);

  const deleteConfig = useCallback((id: string) => {
    setSavedConfigs(prev => {
      const updated = prev.filter(c => c.id !== id);
      try {
        localStorage.setItem(SAVED_CONFIGS_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save saved configs after delete', error);
      }
      if (config.id === id) {
        setConfig(updated.length > 0 ? updated[0] : defaultConfig);
      }
      return updated;
    });
  }, [config.id, setConfig]);

  const importConfigs = useCallback((importedConfigs: DatabaseConfig[]) => {
    setSavedConfigs(importedConfigs);
    try {
      localStorage.setItem(SAVED_CONFIGS_KEY, JSON.stringify(importedConfigs));
    } catch (error) {
      console.error('Failed to save imported configs', error);
    }
  }, []);

  return { config, setConfig, saveConfig, deleteConfig, importConfigs, savedConfigs, status, errorMessage, checkConnection };
};
