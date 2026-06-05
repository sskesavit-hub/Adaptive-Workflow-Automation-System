'use client';
import { useState } from 'react';
import { useApiKeys, LOCAL_LLM_PROVIDERS } from '@/context/ApiKeysContext';
import Icon from '@/components/Icon';

const GEMINI_MODELS = [
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', desc: 'Fast & efficient (recommended)' },
  { value: 'gemini-1.5-pro',   label: 'Gemini 1.5 Pro',   desc: 'Most capable, slower' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', desc: 'Latest generation' },
  { value: 'gemini-1.0-pro',   label: 'Gemini 1.0 Pro',   desc: 'Stable classic model' },
];

const STATUS = {
  unknown:   { bg:'rgba(107,114,128,.1)', border:'rgba(107,114,128,.3)', color:'#9ca3af', dot:'#6b7280', label:'Not tested' },
  checking:  { bg:'rgba(245,158,11,.1)',  border:'rgba(245,158,11,.3)',  color:'#f59e0b', dot:'#f59e0b', label:'Checking...' },
  connected: { bg:'rgba(16,185,129,.1)',  border:'rgba(16,185,129,.3)',  color:'#10b981', dot:'#10b981', label:'Connected' },
  error:     { bg:'rgba(239,68,68,.1)',   border:'rgba(239,68,68,.3)',   color:'#ef4444', dot:'#ef4444', label:'Failed' },
};

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.unknown;
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 12px', borderRadius:100, fontSize:'.8rem', fontWeight:500, background:s.bg, border:`1px solid ${s.border}`, color:s.color }}>
      <div style={{ width:7, height:7, borderRadius:'50%', background:s.dot, animation:status==='checking'?'pulse 1s ease infinite':'none' }} />
      {s.label}
    </div>
  );
}

function Input({ label, keyName, placeholder, description, type = 'password', iconName }) {
  const { keys, updateKey } = useApiKeys();
  const [visible, setVisible] = useState(false);
  return (
    <div style={{ marginBottom:20 }}>
      <label style={{ display:'flex', alignItems:'center', gap:8, fontWeight:500, fontSize:'.9rem', marginBottom:8 }}>
        {iconName && <Icon name={iconName} size={16} color="var(--accent-bright)" />}
        {label}
      </label>
      {description && <p style={{ color:'var(--text-tertiary)', fontSize:'.8rem', marginBottom:8 }}>{description}</p>}
      <div style={{ display:'flex', gap:8 }}>
        <input
          type={type === 'password' && !visible ? 'password' : 'text'}
          value={keys[keyName] || ''}
          onChange={e => updateKey(keyName, e.target.value)}
          placeholder={placeholder}
          style={{ flex:1, padding:'11px 14px', background:'var(--bg-tertiary)', border:'1px solid var(--border)', borderRadius:10, color:'var(--text-primary)', fontSize:'.9rem', outline:'none', fontFamily:'monospace', transition:'border-color .2s' }}
          onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        {type === 'password' && (
          <button onClick={() => setVisible(!visible)} style={{ padding:'11px 14px', background:'var(--bg-tertiary)', border:'1px solid var(--border)', borderRadius:10, color:'var(--text-secondary)', cursor:'pointer', display:'flex', alignItems:'center' }}>
            <Icon name={visible ? 'eyeOff' : 'eye'} size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

function ServiceCard({ title, iconName, children, onTest, status, testLabel = 'Test Connection' }) {
  return (
    <div className="glass" style={{ padding:28, marginBottom:24 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:'var(--accent-dim)', border:'1px solid var(--accent-border)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon name={iconName} size={22} color="var(--accent-bright)" />
          </div>
          <h3 style={{ fontWeight:600, fontSize:'1.05rem' }}>{title}</h3>
        </div>
        <StatusBadge status={status} />
      </div>
      {children}
      <button onClick={onTest} disabled={status === 'checking'} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:10, fontSize:'.9rem', fontWeight:500, background:'var(--bg-tertiary)', border:'1px solid var(--border)', color: status === 'connected' ? '#10b981' : 'var(--text-primary)', cursor: status === 'checking' ? 'not-allowed' : 'pointer', transition:'all .2s', opacity: status === 'checking' ? .6 : 1 }}>
        <Icon name="lightning" size={14} />
        {status === 'checking' ? 'Testing...' : testLabel}
      </button>
    </div>
  );
}

function LocalLlmSection() {
  const { keys, updateKey, updateKeys, connectionStatus, testConnection, localLlmScan, scanLocalLlms } = useApiKeys();
  const { isScanning, results, lastScanned } = localLlmScan;
  const available = results.filter(r => r.available);
  const [customUrl, setCustomUrl] = useState(keys.localLlmUrl || '');
  const [customModel, setCustomModel] = useState(keys.localLlmModel || '');
  const [customMode, setCustomMode] = useState(false);

  const isHosted = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const selectedProvider = LOCAL_LLM_PROVIDERS.find(p => p.id === keys.localLlmProvider);
  const selectedProviderResult = results.find(r => r.id === keys.localLlmProvider);
  const modelList = selectedProviderResult?.models || [];

  const applyCustomUrl = () => {
    if (!customUrl || !customModel) return;
    const isOllama = customUrl.includes('11434') || customModel.includes(':');
    updateKeys({ localLlmEnabled: true, localLlmProvider: isOllama ? 'ollama' : 'lmstudio', localLlmModel: customModel, localLlmUrl: customUrl.replace(/\/$/, '') });
  };

  return (
    <div className="glass" style={{ padding:28, marginBottom:24 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:'var(--accent-dim)', border:'1px solid var(--accent-border)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon name="monitor" size={22} color="var(--accent-bright)" />
          </div>
          <div>
            <h3 style={{ fontWeight:600, fontSize:'1.05rem' }}>Local LLM (No API Key)</h3>
            <p style={{ color:'var(--text-tertiary)', fontSize:'.8rem' }}>Run AI models directly on your device</p>
          </div>
        </div>
        <StatusBadge status={connectionStatus.localLlm} />
      </div>

      {/* HTTPS warning */}
      {isHosted && (
        <div style={{ padding:'14px 16px', borderRadius:10, marginBottom:20, background:'rgba(245,158,11,.07)', border:'1px solid rgba(245,158,11,.3)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <Icon name="warning" size={16} color="#f59e0b" />
            <p style={{ fontWeight:600, color:'#f59e0b', fontSize:'.9rem' }}>Hosted App — Browser Security Blocks localhost</p>
          </div>
          <p style={{ color:'var(--text-secondary)', fontSize:'.83rem', lineHeight:1.6, marginBottom:12 }}>
            Because this app runs on <strong>https://</strong>, your browser blocks connections to <code style={{ background:'rgba(0,0,0,.3)', padding:'2px 5px', borderRadius:4 }}>http://localhost</code>. Choose an option below:
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:8, fontSize:'.83rem' }}>
            <div style={{ padding:'10px 14px', borderRadius:8, background:'rgba(16,185,129,.07)', border:'1px solid rgba(16,185,129,.2)', color:'#10b981', display:'flex', alignItems:'flex-start', gap:8 }}>
              <Icon name="check" size={14} style={{ marginTop:2, flexShrink:0 }} />
              <span><strong>Option A (Easiest):</strong> Run locally — <code style={{ background:'rgba(0,0,0,.3)', padding:'2px 6px', borderRadius:4 }}>npm run dev</code> → open <strong>http://localhost:3000</strong></span>
            </div>
            <div style={{ padding:'10px 14px', borderRadius:8, background:'rgba(124,58,237,.07)', border:'1px solid var(--accent-border)', color:'var(--accent-bright)', display:'flex', alignItems:'flex-start', gap:8 }}>
              <Icon name="link" size={14} style={{ marginTop:2, flexShrink:0 }} />
              <span><strong>Option B (ngrok):</strong> <code style={{ background:'rgba(0,0,0,.3)', padding:'2px 6px', borderRadius:4 }}>ngrok http 11434</code> → paste the https:// URL below</span>
            </div>
          </div>
        </div>
      )}

      {/* Free banner */}
      {!isHosted && (
        <div style={{ padding:'12px 16px', borderRadius:10, marginBottom:20, background:'rgba(16,185,129,.06)', border:'1px solid rgba(16,185,129,.2)', fontSize:'.85rem', color:'#10b981', display:'flex', alignItems:'center', gap:8 }}>
          <Icon name="lock" size={14} />
          <span><strong>100% Free & Private</strong> — Your data never leaves your device</span>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        {!isHosted && (
          <button onClick={scanLocalLlms} disabled={isScanning} style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 20px', borderRadius:10, fontSize:'.9rem', fontWeight:600, background:'linear-gradient(135deg, var(--accent), var(--cyan))', border:'none', color:'#fff', cursor: isScanning ? 'not-allowed' : 'pointer', opacity: isScanning ? .6 : 1 }}>
            <Icon name={isScanning ? 'refresh' : 'search'} size={16} color="#fff" />
            {isScanning ? 'Scanning device...' : 'Scan for Local AI Models'}
          </button>
        )}
        <button onClick={() => setCustomMode(!customMode)} style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 20px', borderRadius:10, fontSize:'.9rem', fontWeight:600, background:'var(--bg-tertiary)', border:'1px solid var(--border)', color:'var(--text-primary)', cursor:'pointer' }}>
          <Icon name={customMode ? 'x' : 'link'} size={16} />
          {customMode ? 'Close' : 'Enter Custom URL (ngrok / tunnel)'}
        </button>
      </div>

      {lastScanned && !isHosted && (
        <p style={{ color:'var(--text-tertiary)', fontSize:'.78rem', marginBottom:16, display:'flex', alignItems:'center', gap:6 }}>
          <Icon name="refresh" size={12} /> Last scanned: {lastScanned.toLocaleTimeString()}
        </p>
      )}

      {/* Custom URL input */}
      {(customMode || isHosted) && (
        <div style={{ marginBottom:20, padding:'16px', borderRadius:10, background:'var(--bg-tertiary)', border:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
            <Icon name="link" size={16} color="var(--accent-bright)" />
            <p style={{ fontWeight:600, fontSize:'.9rem' }}>Custom LLM URL</p>
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:'.83rem', color:'var(--text-secondary)', display:'block', marginBottom:6 }}>
              Base URL <span style={{ color:'var(--text-tertiary)' }}>(e.g. https://abc123.ngrok-free.app or http://localhost:11434)</span>
            </label>
            <input value={customUrl} onChange={e => setCustomUrl(e.target.value)} placeholder="https://abc123.ngrok-free.app"
              style={{ width:'100%', padding:'10px 14px', background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-primary)', fontSize:'.9rem', outline:'none', boxSizing:'border-box', fontFamily:'monospace' }}
              onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:'.83rem', color:'var(--text-secondary)', display:'block', marginBottom:6 }}>
              Model name <span style={{ color:'var(--text-tertiary)' }}>(e.g. llama3, mistral, phi3)</span>
            </label>
            <input value={customModel} onChange={e => setCustomModel(e.target.value)} placeholder="llama3"
              style={{ width:'100%', padding:'10px 14px', background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-primary)', fontSize:'.9rem', outline:'none', boxSizing:'border-box', fontFamily:'monospace' }}
              onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
          <button onClick={applyCustomUrl} disabled={!customUrl || !customModel}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:8, fontSize:'.9rem', fontWeight:600, background:'linear-gradient(135deg, var(--accent), var(--cyan))', border:'none', color:'#fff', cursor: !customUrl || !customModel ? 'not-allowed' : 'pointer', opacity: !customUrl || !customModel ? .5 : 1 }}>
            <Icon name="check" size={16} color="#fff" />
            Connect to this LLM
          </button>
        </div>
      )}

      {/* Scan results */}
      {results.length > 0 && !isHosted && (
        <div style={{ marginBottom:20 }}>
          <p style={{ fontWeight:500, fontSize:'.9rem', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
            <Icon name={available.length > 0 ? 'check' : 'x'} size={14} color={available.length > 0 ? '#10b981' : '#ef4444'} />
            {available.length > 0 ? `Found ${available.length} provider${available.length > 1 ? 's' : ''} running` : 'No local LLM providers found running'}
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {results.map(r => (
              <div key={r.id} style={{
                padding:'12px 16px', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'space-between',
                background: r.available ? 'rgba(16,185,129,.06)' : 'var(--bg-tertiary)',
                border: `1px solid ${r.available ? 'rgba(16,185,129,.25)' : 'var(--border)'}`,
                cursor: r.available ? 'pointer' : 'default',
              }} onClick={() => { if (r.available && r.models.length > 0) updateKeys({ localLlmEnabled:true, localLlmProvider:r.id, localLlmModel:r.models[0], localLlmUrl:r.baseUrl }); }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:'var(--bg-secondary)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Icon name="cpu" size={16} color={r.available ? '#10b981' : 'var(--text-tertiary)'} />
                  </div>
                  <div>
                    <div style={{ fontWeight:500, fontSize:'.9rem', color: r.available ? '#10b981' : 'var(--text-secondary)' }}>{r.name}</div>
                    <div style={{ fontSize:'.75rem', color:'var(--text-tertiary)', fontFamily:'monospace' }}>{r.baseUrl}</div>
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  {r.available ? (
                    <>
                      <div style={{ color:'#10b981', fontSize:'.8rem', fontWeight:500 }}>Running</div>
                      <div style={{ color:'var(--text-tertiary)', fontSize:'.75rem' }}>{r.models.length} model{r.models.length !== 1 ? 's' : ''}</div>
                    </>
                  ) : (
                    <div style={{ color:'var(--text-tertiary)', fontSize:'.8rem' }}>Not running</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active config */}
      {keys.localLlmEnabled && selectedProvider && (
        <div style={{ marginBottom:16, padding:'16px', borderRadius:10, background:'rgba(16,185,129,.06)', border:'1px solid rgba(16,185,129,.25)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <p style={{ fontWeight:500, fontSize:'.9rem', color:'#10b981', display:'flex', alignItems:'center', gap:8 }}>
              <Icon name="check" size={14} color="#10b981" />
              Active: {selectedProvider.name} — <code style={{ fontSize:'.85rem' }}>{keys.localLlmModel}</code>
            </p>
            <button onClick={() => updateKey('localLlmEnabled', false)} style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:6, fontSize:'.75rem', background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.3)', color:'#ef4444', cursor:'pointer' }}>
              <Icon name="x" size={12} color="#ef4444" /> Disconnect
            </button>
          </div>
          <div style={{ fontSize:'.78rem', color:'var(--text-tertiary)', fontFamily:'monospace' }}>{keys.localLlmUrl}</div>
          {modelList.length > 1 && (
            <select value={keys.localLlmModel || ''} onChange={e => updateKey('localLlmModel', e.target.value)} style={{ marginTop:10, width:'100%', padding:'8px 12px', background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-primary)', fontSize:'.85rem' }}>
              {modelList.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          )}
        </div>
      )}

      {/* Install guide */}
      {results.length > 0 && available.length === 0 && !isHosted && (
        <div style={{ padding:'16px', borderRadius:10, background:'rgba(245,158,11,.06)', border:'1px solid rgba(245,158,11,.2)', marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <Icon name="info" size={16} color="#f59e0b" />
            <p style={{ fontWeight:600, color:'#f59e0b', fontSize:'.9rem' }}>Install a local LLM:</p>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8, fontSize:'.85rem', color:'var(--text-secondary)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}><Icon name="cpu" size={14} /> <span><strong>Ollama</strong> (easiest) → <a href="https://ollama.ai" target="_blank" rel="noreferrer" style={{ color:'var(--accent-bright)' }}>ollama.ai</a> → run: <code style={{ background:'rgba(0,0,0,.3)', padding:'2px 6px', borderRadius:4 }}>ollama run llama3</code></span></div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}><Icon name="monitor" size={14} /> <span><strong>LM Studio</strong> → <a href="https://lmstudio.ai" target="_blank" rel="noreferrer" style={{ color:'var(--accent-bright)' }}>lmstudio.ai</a> → Start local server</span></div>
          </div>
        </div>
      )}

      <button onClick={() => testConnection('localLlm')} disabled={!keys.localLlmProvider || connectionStatus.localLlm === 'checking'}
        style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:10, fontSize:'.9rem', fontWeight:500, background:'var(--bg-tertiary)', border:'1px solid var(--border)', color:'var(--text-primary)', cursor:'pointer', opacity: !keys.localLlmProvider ? .5 : 1 }}>
        <Icon name="lightning" size={14} /> Test Local LLM
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { keys, updateKey, connectionStatus, testConnection } = useApiKeys();
  const [testResults, setTestResults] = useState({});
  const [testingAll, setTestingAll] = useState(false);

  const handleTest = async (service) => {
    const r = await testConnection(service);
    setTestResults(prev => ({ ...prev, [service]: r }));
  };

  const handleTestAll = async () => {
    setTestingAll(true);
    await Promise.all([testConnection('gemini'), testConnection('localLlm')]);
    setTestingAll(false);
  };

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'24px 32px', borderBottom:'1px solid var(--border)', background:'rgba(8,8,15,.8)', backdropFilter:'blur(12px)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <div>
          <h1 style={{ fontSize:'1.4rem', fontWeight:700, letterSpacing:'-.02em' }}>API Keys & Settings</h1>
          <p style={{ color:'var(--text-tertiary)', fontSize:'.85rem', marginTop:4 }}>Add API keys or use a free local LLM</p>
        </div>
        <button onClick={handleTestAll} disabled={testingAll} className="btn-primary" style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', fontSize:'.9rem', opacity: testingAll ? .6 : 1 }}>
          <Icon name="lightning" size={16} color="#fff" />
          {testingAll ? 'Testing...' : 'Test All'}
        </button>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'32px', maxWidth:820, width:'100%' }}>

        {/* Local LLM */}
        <LocalLlmSection />

        {/* Gemini */}
        <ServiceCard title="Google Gemini AI (Optional)" iconName="robot" status={connectionStatus.gemini} onTest={() => handleTest('gemini')}>
          <Input label="Gemini API Key" keyName="geminiApiKey" placeholder="AIzaSy..." iconName="key" description="Free key from aistudio.google.com/apikey — optional if using local LLM" />
          <div style={{ marginBottom:20 }}>
            <label style={{ display:'flex', alignItems:'center', gap:8, fontWeight:500, fontSize:'.9rem', display:'block', marginBottom:12 }}>
              <span style={{ display:'flex', alignItems:'center', gap:8 }}><Icon name="cpu" size={16} color="var(--accent-bright)" /> Model</span>
            </label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {GEMINI_MODELS.map(m => (
                <div key={m.value} onClick={() => updateKey('modelName', m.value)} style={{ padding:14, borderRadius:10, cursor:'pointer', border:`1px solid ${keys.modelName === m.value ? 'var(--accent-border)' : 'var(--border)'}`, background: keys.modelName === m.value ? 'var(--accent-dim)' : 'var(--bg-tertiary)', transition:'all .2s' }}>
                  {keys.modelName === m.value && (
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                      <Icon name="check" size={12} color="var(--accent-bright)" />
                      <div style={{ fontWeight:600, fontSize:'.9rem', color:'var(--accent-bright)' }}>{m.label}</div>
                    </div>
                  )}
                  {keys.modelName !== m.value && <div style={{ fontWeight:600, fontSize:'.9rem', color:'var(--text-primary)', marginBottom:4 }}>{m.label}</div>}
                  <div style={{ fontSize:'.78rem', color:'var(--text-tertiary)' }}>{m.desc}</div>
                </div>
              ))}
            </div>
          </div>
          {testResults.gemini && (
            <div style={{ padding:'10px 14px', borderRadius:8, marginBottom:16, fontSize:'.85rem', display:'flex', alignItems:'center', gap:8, background: testResults.gemini.success ? 'rgba(16,185,129,.08)' : 'rgba(239,68,68,.08)', border:`1px solid ${testResults.gemini.success ? 'rgba(16,185,129,.25)' : 'rgba(239,68,68,.25)'}`, color: testResults.gemini.success ? '#10b981' : '#ef4444' }}>
              <Icon name={testResults.gemini.success ? 'check' : 'x'} size={14} />
              {testResults.gemini.success ? testResults.gemini.message : testResults.gemini.error}
            </div>
          )}
        </ServiceCard>

        {/* Privacy note */}
        <div className="glass" style={{ padding:'20px 24px', background:'rgba(124,58,237,.05)', borderColor:'var(--accent-border)' }}>
          <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
            <div style={{ padding:8, borderRadius:8, background:'var(--accent-dim)', border:'1px solid var(--accent-border)', flexShrink:0 }}>
              <Icon name="lock" size={18} color="var(--accent-bright)" />
            </div>
            <div>
              <p style={{ fontWeight:600, marginBottom:6, fontSize:'.95rem' }}>Your data stays private</p>
              <p style={{ color:'var(--text-secondary)', fontSize:'.85rem', lineHeight:1.6 }}>
                API keys are stored only in your browser's localStorage. Local LLM models run entirely on your device — no data is sent anywhere.
              </p>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
}
