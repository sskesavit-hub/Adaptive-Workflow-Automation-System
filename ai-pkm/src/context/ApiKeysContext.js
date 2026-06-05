'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const ApiKeysContext = createContext();

// Known local LLM providers to scan
export const LOCAL_LLM_PROVIDERS = [
  {
    id: 'ollama',
    name: 'Ollama',
    icon: '🦙',
    baseUrl: 'http://localhost:11434',
    modelsEndpoint: '/api/tags',
    modelsPath: 'models', // response.models[]
    modelNameKey: 'name',
    type: 'ollama',
  },
  {
    id: 'lmstudio',
    name: 'LM Studio',
    icon: '🔬',
    baseUrl: 'http://localhost:1234',
    modelsEndpoint: '/v1/models',
    modelsPath: 'data',
    modelNameKey: 'id',
    type: 'openai',
  },
  {
    id: 'jan',
    name: 'Jan',
    icon: '🌐',
    baseUrl: 'http://localhost:1337',
    modelsEndpoint: '/v1/models',
    modelsPath: 'data',
    modelNameKey: 'id',
    type: 'openai',
  },
  {
    id: 'gpt4all',
    name: 'GPT4All',
    icon: '🤖',
    baseUrl: 'http://localhost:4891',
    modelsEndpoint: '/v1/models',
    modelsPath: 'data',
    modelNameKey: 'id',
    type: 'openai',
  },
  {
    id: 'localai',
    name: 'LocalAI',
    icon: '⚡',
    baseUrl: 'http://localhost:8080',
    modelsEndpoint: '/v1/models',
    modelsPath: 'data',
    modelNameKey: 'id',
    type: 'openai',
  },
];

const DEFAULT_KEYS = {
  geminiApiKey: '',
  modelName: 'gemini-1.5-flash',
  supabaseUrl: '',
  supabaseAnonKey: '',
  backendUrl: 'http://localhost:8000',
  // Local LLM settings
  localLlmEnabled: false,
  localLlmProvider: '',   // provider id e.g. 'ollama'
  localLlmModel: '',      // selected model name
  localLlmUrl: '',        // custom base URL
};

export function ApiKeysProvider({ children }) {
  const [keys, setKeys] = useState(DEFAULT_KEYS);
  const [connectionStatus, setConnectionStatus] = useState({
    gemini: 'unknown',
    supabase: 'unknown',
    backend: 'unknown',
    localLlm: 'unknown',
  });
  const [localLlmScan, setLocalLlmScan] = useState({
    isScanning: false,
    results: [],   // [{ provider, models: [], available: bool }]
    lastScanned: null,
  });

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('neuralvault_keys');
      if (saved) setKeys(prev => ({ ...prev, ...JSON.parse(saved) }));
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

  // ── Scan for local LLMs (BROWSER-SIDE — directly hits localhost) ─
  const scanLocalLlms = async () => {
    setLocalLlmScan(prev => ({ ...prev, isScanning: true, results: [] }));
    const results = [];

    for (const provider of LOCAL_LLM_PROVIDERS) {
      try {
        // Fetch directly from the browser so it hits the user's localhost
        const url = `${provider.baseUrl}${provider.modelsEndpoint}`;
        const res = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(3000),
        });

        if (!res.ok) {
          results.push({ ...provider, models: [], available: false });
          continue;
        }

        const data = await res.json();

        // Extract model list
        let models = [];
        if (provider.modelsPath && data[provider.modelsPath]) {
          models = data[provider.modelsPath].map(m => m[provider.modelNameKey] || m.name || m);
        } else if (Array.isArray(data)) {
          models = data.map(m => m.name || m.id || m);
        }

        results.push({ ...provider, models, available: true });
      } catch {
        results.push({ ...provider, models: [], available: false });
      }
    }

    setLocalLlmScan({ isScanning: false, results, lastScanned: new Date() });

    // Auto-select first available provider
    const first = results.find(r => r.available && r.models.length > 0);
    if (first && !keys.localLlmProvider) {
      updateKeys({
        localLlmEnabled: true,
        localLlmProvider: first.id,
        localLlmModel: first.models[0],
        localLlmUrl: first.baseUrl,
      });
    }

    return results;
  };

  // ── Test connection ─────────────────────────────────────────
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
        const res = await fetch(`${keys.backendUrl || 'http://localhost:8000'}/health`,
          { signal: AbortSignal.timeout(4000) });
        setConnectionStatus(prev => ({ ...prev, backend: res.ok ? 'connected' : 'error' }));
        return { success: res.ok };
      }
      if (service === 'localLlm') {
        const provider = LOCAL_LLM_PROVIDERS.find(p => p.id === keys.localLlmProvider);
        if (!provider) {
          setConnectionStatus(prev => ({ ...prev, localLlm: 'error' }));
          return { success: false, error: 'No provider selected' };
        }
        const res = await fetch('/api/scan-local-llm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider }),
          signal: AbortSignal.timeout(4000),
        });
        const data = await res.json();
        setConnectionStatus(prev => ({ ...prev, localLlm: data.available ? 'connected' : 'error' }));
        return { success: data.available };
      }
    } catch (e) {
      setConnectionStatus(prev => ({ ...prev, [service]: 'error' }));
      return { success: false, error: e.message };
    }
  };

  const testAll = async () => {
    const promises = [testConnection('supabase'), testConnection('backend')];
    if (keys.geminiApiKey) promises.push(testConnection('gemini'));
    if (keys.localLlmEnabled) promises.push(testConnection('localLlm'));
    await Promise.all(promises);
  };

  return (
    <ApiKeysContext.Provider value={{
      keys, updateKey, updateKeys,
      connectionStatus, testConnection, testAll,
      localLlmScan, scanLocalLlms,
    }}>
      {children}
    </ApiKeysContext.Provider>
  );
}

export const useApiKeys = () => useContext(ApiKeysContext);
