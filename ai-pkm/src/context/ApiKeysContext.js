'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const ApiKeysContext = createContext();

const DEFAULT_KEYS = {
  geminiApiKey: '',
  modelName: 'gemini-1.5-flash',
  supabaseUrl: '',
  supabaseAnonKey: '',
  backendUrl: 'http://localhost:8000',
};

export function ApiKeysProvider({ children }) {
  const [keys, setKeys] = useState(DEFAULT_KEYS);
  const [connectionStatus, setConnectionStatus] = useState({
    gemini: 'unknown',    // 'unknown' | 'checking' | 'connected' | 'error'
    supabase: 'unknown',
    backend: 'unknown',
  });

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('neuralvault_keys');
      if (saved) {
        setKeys(prev => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch {}
  }, []);

  const updateKey = (key, value) => {
    setKeys(prev => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem('neuralvault_keys', JSON.stringify(updated));
      return updated;
    });
  };

  const updateKeys = (newKeys) => {
    setKeys(prev => {
      const updated = { ...prev, ...newKeys };
      localStorage.setItem('neuralvault_keys', JSON.stringify(updated));
      return updated;
    });
  };

  const testConnection = async (service) => {
    setConnectionStatus(prev => ({ ...prev, [service]: 'checking' }));

    try {
      if (service === 'gemini') {
        const res = await fetch('/api/test-connection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ service: 'gemini', apiKey: keys.geminiApiKey, modelName: keys.modelName }),
        });
        const data = await res.json();
        setConnectionStatus(prev => ({ ...prev, gemini: data.success ? 'connected' : 'error' }));
        return data;
      }

      if (service === 'supabase') {
        const res = await fetch('/api/test-connection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ service: 'supabase', supabaseUrl: keys.supabaseUrl, supabaseAnonKey: keys.supabaseAnonKey }),
        });
        const data = await res.json();
        setConnectionStatus(prev => ({ ...prev, supabase: data.success ? 'connected' : 'error' }));
        return data;
      }

      if (service === 'backend') {
        const res = await fetch(`${keys.backendUrl || 'http://localhost:8000'}/health`);
        setConnectionStatus(prev => ({ ...prev, backend: res.ok ? 'connected' : 'error' }));
        return { success: res.ok };
      }
    } catch (e) {
      setConnectionStatus(prev => ({ ...prev, [service]: 'error' }));
      return { success: false, error: e.message };
    }
  };

  const testAll = async () => {
    await Promise.all([
      testConnection('gemini'),
      testConnection('supabase'),
      testConnection('backend'),
    ]);
  };

  return (
    <ApiKeysContext.Provider value={{ keys, updateKey, updateKeys, connectionStatus, testConnection, testAll }}>
      {children}
    </ApiKeysContext.Provider>
  );
}

export const useApiKeys = () => useContext(ApiKeysContext);
