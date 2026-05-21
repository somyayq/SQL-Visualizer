import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'sql_visualizer_query_history';
const MAX_HISTORY_ITEMS = 50;

export interface HistoryItem {
  id: string;
  query: string;
  timestamp: number;
  rows?: number;
  cost?: number;
  status?: 'success' | 'error';
  errorMessage?: string;
}

export const useQueryHistory = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load query history', error);
    }
  }, []);

  const saveToHistory = useCallback((query: string, rows?: number, cost?: number, status?: 'success' | 'error', errorMessage?: string) => {
    if (!query.trim()) return;

    setHistory((prev) => {
      // Remove duplicate if it already exists to move it to the top
      const existing = prev.find((item) => item.query === query);
      const filtered = prev.filter((item) => item.query !== query);
      
      const newItem: HistoryItem = {
        id: existing ? existing.id : (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()),
        query,
        timestamp: Date.now(),
        rows: rows !== undefined ? rows : existing?.rows,
        cost: cost !== undefined ? cost : existing?.cost,
        status: status !== undefined ? status : existing?.status,
        errorMessage: errorMessage !== undefined ? errorMessage : existing?.errorMessage,
      };
      
      const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save query history', error);
      }
      
      return updated;
    });
  }, []);

  const setHistoryList = useCallback((newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Failed to save query history', error);
    }
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear query history', error);
    }
  }, []);

  return { history, saveToHistory, clearHistory, setHistoryList };
};
