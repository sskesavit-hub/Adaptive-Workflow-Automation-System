'use client';
import { useState } from 'react';
import { useApiKeys } from '@/context/ApiKeysContext';

const GEMINI_MODELS = [
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', desc: 'Fast & efficient (recommended)' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', desc: 'Most capable, slower' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', desc: 'Latest generation' },
  { value: 'gemini-1.0-pro', label: 'Gemini 1.0 Pro', desc: 'Stable classic model' },
];

const STATUS_COLORS = {
  unknown:    { bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.3)', color: '#9ca3af', dot: '#6b7280', label: 'Not tested' },
  checking:   { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)',  color: '#f59e0b', dot: '#f59e0b', label: 'Checking...' },
  connected:  { bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.3)',  color: '#10b981', dot: '#10b981', label: 'Connected ✓' },
  error:      { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)',   color: '#ef4444', dot: '#ef4444', label: 'Failed ✗' },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.unknown;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '4px 12px', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 500,
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
    }}>
      <div style={{
        width: 7, height: 7, borderRadius: '50%', background: s.dot,
        animation: status === 'checking' ? 'pulse 1s ease infinite' : 'none',
      }} />
      {s.label}
    </div>
  );
}

function ApiKeyInput({ label, keyName, placeholder, description, type = 'password', icon }) {
  const { keys, updateKey } = useApiKeys();
  const [visible, setVisible] = useState(false);

  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500, fontSize: '0.9rem', marginBottom: '8px' }}>
        <span>{icon}</span> {label}
      </label>
      {description && (
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', marginBottom: '8px' }}>{description}</p>
      )}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type={type === 'password' && !visible ? 'password' : 'text'}
          value={keys[keyName] || ''}
          onChange={e => updateKey(keyName, e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1, padding: '11px 14px',
            background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
            borderRadius: '10px', color: 'var(--text-primary)',
            fontSize: '0.9rem', outline: 'none', fontFamily: 'var(--font-mono, monospace)',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        {type === 'password' && (
          <button
            onClick={() => setVisible(!visible)}
            style={{
              padding: '11px 14px', background: 'var(--bg-tertiary)',
              border: '1px solid var(--border)', borderRadius: '10px',
              color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem',
            }}
          >{visible ? '🙈' : '👁️'}</button>
        )}
      </div>
    </div>
  );
}

function ServiceCard({ title, icon, service, children, onTest, status, testLabel = 'Test Connection' }) {
  return (
    <div className="glass" style={{ padding: '28px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: 44, height: 44, borderRadius: '12px',
            background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
          }}>{icon}</div>
          <div>
            <h3 style={{ fontWeight: 600, fontSize: '1.05rem' }}>{title}</h3>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      {children}

      <button
        onClick={onTest}
        disabled={status === 'checking'}
        style={{
          padding: '10px 20px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 500,
          background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
          color: status === 'connected' ? '#10b981' : 'var(--text-primary)',
          cursor: status === 'checking' ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s', opacity: status === 'checking' ? 0.6 : 1,
        }}
        onMouseEnter={e => { if (status !== 'checking') { e.currentTarget.style.borderColor = 'var(--border-focus)'; } }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
      >
        {status === 'checking' ? '⏳ Testing...' : `⚡ ${testLabel}`}
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { keys, updateKey, connectionStatus, testConnection, testAll } = useApiKeys();
  const [testResults, setTestResults] = useState({});
  const [isTestingAll, setIsTestingAll] = useState(false);

  const handleTest = async (service) => {
    const result = await testConnection(service);
    setTestResults(prev => ({ ...prev, [service]: result }));
  };

  const handleTestAll = async () => {
    setIsTestingAll(true);
    await testAll();
    setIsTestingAll(false);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '24px 32px', borderBottom: '1px solid var(--border)',
        background: 'rgba(8,8,15,0.8)', backdropFilter: 'blur(12px)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
      }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em' }}>API Keys & Settings</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Keys are stored locally in your browser — never sent to any server
          </p>
        </div>
        <button
          onClick={handleTestAll}
          disabled={isTestingAll}
          className="btn-primary"
          style={{ padding: '10px 20px', fontSize: '0.9rem', opacity: isTestingAll ? 0.6 : 1 }}
        >
          {isTestingAll ? '⏳ Testing All...' : '⚡ Test All Connections'}
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px', maxWidth: '800px', width: '100%' }}>

        {/* Overall status banner */}
        {Object.values(connectionStatus).some(s => s === 'connected') && (
          <div style={{
            padding: '16px 20px', borderRadius: '12px', marginBottom: '28px',
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
            display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            <span style={{ fontSize: '1.4rem' }}>🎉</span>
            <div>
              <p style={{ fontWeight: 600, color: '#10b981', fontSize: '0.95rem' }}>Services connected!</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>You can now use the AI Chat and upload documents.</p>
            </div>
          </div>
        )}

        {/* Gemini AI */}
        <ServiceCard
          title="Google Gemini AI"
          icon="🤖"
          service="gemini"
          status={connectionStatus.gemini}
          onTest={() => handleTest('gemini')}
        >
          <ApiKeyInput
            label="Gemini API Key"
            keyName="geminiApiKey"
            placeholder="AIzaSy..."
            icon="🔑"
            description="Get your free key from Google AI Studio → aistudio.google.com/apikey"
          />

          {/* Model selector */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontWeight: 500, fontSize: '0.9rem', display: 'block', marginBottom: '12px' }}>
              🧠 AI Model
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {GEMINI_MODELS.map(m => (
                <div
                  key={m.value}
                  onClick={() => updateKey('modelName', m.value)}
                  style={{
                    padding: '14px', borderRadius: '10px', cursor: 'pointer',
                    border: `1px solid ${keys.modelName === m.value ? 'var(--accent-border)' : 'var(--border)'}`,
                    background: keys.modelName === m.value ? 'var(--accent-dim)' : 'var(--bg-tertiary)',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: keys.modelName === m.value ? 'var(--accent-bright)' : 'var(--text-primary)', marginBottom: '4px' }}>
                    {keys.modelName === m.value ? '✓ ' : ''}{m.label}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>{m.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {testResults.gemini && (
            <div style={{
              padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem',
              background: testResults.gemini.success ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${testResults.gemini.success ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
              color: testResults.gemini.success ? '#10b981' : '#ef4444',
            }}>
              {testResults.gemini.success ? `✅ ${testResults.gemini.message}` : `❌ ${testResults.gemini.error}`}
            </div>
          )}
        </ServiceCard>

        {/* Supabase */}
        <ServiceCard
          title="Supabase (Database & Storage)"
          icon="🗄️"
          service="supabase"
          status={connectionStatus.supabase}
          onTest={() => handleTest('supabase')}
        >
          <ApiKeyInput
            label="Supabase Project URL"
            keyName="supabaseUrl"
            placeholder="https://xxxx.supabase.co"
            icon="🌐"
            type="text"
            description="Found in Supabase Dashboard → Settings → API"
          />
          <ApiKeyInput
            label="Supabase Anon Key"
            keyName="supabaseAnonKey"
            placeholder="sb_publishable_... or eyJ..."
            icon="🔑"
            description="The public 'anon' key from Settings → API → Project API keys"
          />

          {testResults.supabase && (
            <div style={{
              padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem',
              background: testResults.supabase.success ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${testResults.supabase.success ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
              color: testResults.supabase.success ? '#10b981' : '#ef4444',
            }}>
              {testResults.supabase.success ? `✅ ${testResults.supabase.message}` : `❌ ${testResults.supabase.error}`}
            </div>
          )}
        </ServiceCard>

        {/* Python Backend */}
        <ServiceCard
          title="AI Backend (FastAPI)"
          icon="⚙️"
          service="backend"
          status={connectionStatus.backend}
          onTest={() => handleTest('backend')}
          testLabel="Ping Backend"
        >
          <ApiKeyInput
            label="Backend URL"
            keyName="backendUrl"
            placeholder="http://localhost:8000"
            icon="🔗"
            type="text"
            description="Local: http://localhost:8000 | Railway: https://your-app.railway.app"
          />
          <div style={{
            padding: '12px 16px', borderRadius: '10px', marginBottom: '16px',
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
            fontSize: '0.85rem', color: '#f59e0b',
          }}>
            💡 To start the backend locally: open a terminal → <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>cd backend</code> → <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>python main.py</code>
          </div>
        </ServiceCard>

        {/* Privacy note */}
        <div className="glass" style={{
          padding: '20px 24px',
          background: 'rgba(124,58,237,0.05)', borderColor: 'var(--accent-border)',
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.3rem' }}>🔒</span>
            <div>
              <p style={{ fontWeight: 600, marginBottom: '6px', fontSize: '0.95rem' }}>Your keys are 100% private</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.6' }}>
                API keys entered here are stored only in your browser's localStorage and sent only to your own backend or directly to the respective service. NeuralVault never logs or stores your keys on any server.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }`}</style>
    </div>
  );
}
