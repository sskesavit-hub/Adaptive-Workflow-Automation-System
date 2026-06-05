'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useApiKeys, LOCAL_LLM_PROVIDERS } from '@/context/ApiKeysContext';

const GEMINI_MODELS = [
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', desc: 'Fast & efficient (recommended)' },
  { value: 'gemini-1.5-pro',   label: 'Gemini 1.5 Pro',   desc: 'Most capable, slower' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', desc: 'Latest generation' },
  { value: 'gemini-1.0-pro',   label: 'Gemini 1.0 Pro',   desc: 'Stable classic model' },
];

const STATUS = {
  unknown:   { bg:'rgba(107,114,128,.1)', border:'rgba(107,114,128,.3)', color:'#9ca3af', dot:'#6b7280', label:'Not tested' },
  checking:  { bg:'rgba(245,158,11,.1)',  border:'rgba(245,158,11,.3)',  color:'#f59e0b', dot:'#f59e0b', label:'Checking...' },
  connected: { bg:'rgba(16,185,129,.1)',  border:'rgba(16,185,129,.3)',  color:'#10b981', dot:'#10b981', label:'Connected ✓' },
  error:     { bg:'rgba(239,68,68,.1)',   border:'rgba(239,68,68,.3)',   color:'#ef4444', dot:'#ef4444', label:'Failed ✗' },
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

function Input({ label, keyName, placeholder, description, type='password', icon }) {
  const { keys, updateKey } = useApiKeys();
  const [visible, setVisible] = useState(false);
  return (
    <div style={{ marginBottom:20 }}>
      <label style={{ display:'flex', alignItems:'center', gap:8, fontWeight:500, fontSize:'.9rem', marginBottom:8 }}>
        {icon} {label}
      </label>
      {description && <p style={{ color:'var(--text-tertiary)', fontSize:'.8rem', marginBottom:8 }}>{description}</p>}
      <div style={{ display:'flex', gap:8 }}>
        <input
          type={type==='password'&&!visible?'password':'text'}
          value={keys[keyName]||''}
          onChange={e=>updateKey(keyName,e.target.value)}
          placeholder={placeholder}
          style={{ flex:1, padding:'11px 14px', background:'var(--bg-tertiary)', border:'1px solid var(--border)', borderRadius:10, color:'var(--text-primary)', fontSize:'.9rem', outline:'none', fontFamily:'monospace', transition:'border-color .2s' }}
          onFocus={e=>e.target.style.borderColor='var(--border-focus)'}
          onBlur={e=>e.target.style.borderColor='var(--border)'}
        />
        {type==='password'&&<button onClick={()=>setVisible(!visible)} style={{ padding:'11px 14px', background:'var(--bg-tertiary)', border:'1px solid var(--border)', borderRadius:10, color:'var(--text-secondary)', cursor:'pointer' }}>{visible?'🙈':'👁️'}</button>}
      </div>
    </div>
  );
}

function ServiceCard({ title, icon, children, onTest, status, testLabel='Test Connection' }) {
  return (
    <div className="glass" style={{ padding:28, marginBottom:24 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:'var(--accent-dim)', border:'1px solid var(--accent-border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem' }}>{icon}</div>
          <h3 style={{ fontWeight:600, fontSize:'1.05rem' }}>{title}</h3>
        </div>
        <StatusBadge status={status} />
      </div>
      {children}
      <button onClick={onTest} disabled={status==='checking'} style={{ padding:'10px 20px', borderRadius:10, fontSize:'.9rem', fontWeight:500, background:'var(--bg-tertiary)', border:'1px solid var(--border)', color:status==='connected'?'#10b981':'var(--text-primary)', cursor:status==='checking'?'not-allowed':'pointer', transition:'all .2s', opacity:status==='checking'?.6:1 }}>
        {status==='checking'?'⏳ Testing...':`⚡ ${testLabel}`}
      </button>
    </div>
  );
}

function LocalLlmSection() {
  const { keys, updateKey, updateKeys, connectionStatus, testConnection, localLlmScan, scanLocalLlms } = useApiKeys();
  const { isScanning, results, lastScanned } = localLlmScan;
  const available = results.filter(r => r.available);

  const selectedProvider = LOCAL_LLM_PROVIDERS.find(p => p.id === keys.localLlmProvider);
  const selectedProviderResult = results.find(r => r.id === keys.localLlmProvider);
  const modelList = selectedProviderResult?.models || [];

  return (
    <div className="glass" style={{ padding:28, marginBottom:24 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:'var(--accent-dim)', border:'1px solid var(--accent-border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem' }}>🖥️</div>
          <div>
            <h3 style={{ fontWeight:600, fontSize:'1.05rem' }}>Local LLM (No API Key)</h3>
            <p style={{ color:'var(--text-tertiary)', fontSize:'.8rem' }}>Run AI models directly on your device</p>
          </div>
        </div>
        <StatusBadge status={connectionStatus.localLlm} />
      </div>

      {/* Info banner */}
      <div style={{ padding:'12px 16px', borderRadius:10, marginBottom:20, background:'rgba(16,185,129,.06)', border:'1px solid rgba(16,185,129,.2)', fontSize:'.85rem', color:'#10b981' }}>
        🆓 <strong>100% Free & Private</strong> — Your data never leaves your device when using a local LLM
      </div>

      {/* Scan button */}
      <button onClick={scanLocalLlms} disabled={isScanning} style={{ padding:'12px 20px', borderRadius:10, fontSize:'.9rem', fontWeight:600, background:'linear-gradient(135deg, var(--accent), var(--cyan))', border:'none', color:'#fff', cursor:isScanning?'not-allowed':'pointer', opacity:isScanning?.6:1, marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
        {isScanning ? '🔍 Scanning device...' : '🔍 Scan for Local AI Models'}
      </button>

      {lastScanned && (
        <p style={{ color:'var(--text-tertiary)', fontSize:'.78rem', marginBottom:16 }}>
          Last scanned: {lastScanned.toLocaleTimeString()}
        </p>
      )}

      {/* Scan results */}
      {results.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <p style={{ fontWeight:500, fontSize:'.9rem', marginBottom:12 }}>
            {available.length > 0 ? `✅ Found ${available.length} provider${available.length>1?'s':''} running on your device:` : '❌ No local LLM providers found running'}
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
                  <span style={{ fontSize:'1.2rem' }}>{r.icon}</span>
                  <div>
                    <div style={{ fontWeight:500, fontSize:'.9rem', color: r.available ? '#10b981' : 'var(--text-secondary)' }}>{r.name}</div>
                    <div style={{ fontSize:'.75rem', color:'var(--text-tertiary)' }}>{r.baseUrl}</div>
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  {r.available ? (
                    <>
                      <div style={{ color:'#10b981', fontSize:'.8rem', fontWeight:500 }}>● Running</div>
                      <div style={{ color:'var(--text-tertiary)', fontSize:'.75rem' }}>{r.models.length} model{r.models.length!==1?'s':''}</div>
                    </>
                  ) : (
                    <div style={{ color:'var(--text-tertiary)', fontSize:'.8rem' }}>● Not running</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Provider + model selector */}
      {keys.localLlmEnabled && selectedProvider && (
        <div style={{ marginBottom:20, padding:'16px', borderRadius:10, background:'var(--bg-tertiary)', border:'1px solid var(--border)' }}>
          <p style={{ fontWeight:500, marginBottom:12, fontSize:'.9rem' }}>
            🎯 Active: {selectedProvider.icon} {selectedProvider.name}
          </p>
          {modelList.length > 0 && (
            <div>
              <label style={{ fontWeight:500, fontSize:'.85rem', marginBottom:8, display:'block' }}>Model</label>
              <select
                value={keys.localLlmModel||''}
                onChange={e=>updateKey('localLlmModel', e.target.value)}
                style={{ width:'100%', padding:'10px 14px', background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-primary)', fontSize:'.9rem' }}
              >
                {modelList.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          )}
          <button onClick={()=>updateKey('localLlmEnabled',false)} style={{ marginTop:12, padding:'8px 14px', borderRadius:8, fontSize:'.8rem', background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.3)', color:'#ef4444', cursor:'pointer' }}>
            Disable Local LLM
          </button>
        </div>
      )}

      {/* Install guide if none found */}
      {results.length > 0 && available.length === 0 && (
        <div style={{ padding:'16px', borderRadius:10, background:'rgba(245,158,11,.06)', border:'1px solid rgba(245,158,11,.2)' }}>
          <p style={{ fontWeight:600, color:'#f59e0b', marginBottom:10, fontSize:'.9rem' }}>💡 How to install a local LLM:</p>
          <div style={{ display:'flex', flexDirection:'column', gap:8, fontSize:'.85rem', color:'var(--text-secondary)' }}>
            <div>🦙 <strong>Ollama</strong> (easiest) → <a href="https://ollama.ai" target="_blank" rel="noreferrer" style={{ color:'var(--accent-bright)' }}>ollama.ai</a> → then run: <code style={{ background:'rgba(0,0,0,.3)', padding:'2px 6px', borderRadius:4 }}>ollama run llama3</code></div>
            <div>🔬 <strong>LM Studio</strong> → <a href="https://lmstudio.ai" target="_blank" rel="noreferrer" style={{ color:'var(--accent-bright)' }}>lmstudio.ai</a> → Download → Start local server</div>
            <div>🌐 <strong>Jan</strong> → <a href="https://jan.ai" target="_blank" rel="noreferrer" style={{ color:'var(--accent-bright)' }}>jan.ai</a> → Install → Start API server</div>
          </div>
        </div>
      )}

      <button onClick={()=>testConnection('localLlm')} disabled={!keys.localLlmProvider || connectionStatus.localLlm==='checking'} style={{ marginTop:16, padding:'10px 20px', borderRadius:10, fontSize:'.9rem', fontWeight:500, background:'var(--bg-tertiary)', border:'1px solid var(--border)', color:'var(--text-primary)', cursor:'pointer', opacity:!keys.localLlmProvider?.5:1 }}>
        ⚡ Test Local LLM
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { keys, updateKey, connectionStatus, testConnection, testAll } = useApiKeys();
  const [testResults, setTestResults] = useState({});
  const [testingAll, setTestingAll] = useState(false);

  const handleTest = async (service) => {
    const r = await testConnection(service);
    setTestResults(prev => ({ ...prev, [service]: r }));
  };

  const handleTestAll = async () => { setTestingAll(true); await testAll(); setTestingAll(false); };

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'24px 32px', borderBottom:'1px solid var(--border)', background:'rgba(8,8,15,.8)', backdropFilter:'blur(12px)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <div>
          <h1 style={{ fontSize:'1.4rem', fontWeight:700, letterSpacing:'-.02em' }}>API Keys & Settings</h1>
          <p style={{ color:'var(--text-tertiary)', fontSize:'.85rem', marginTop:4 }}>Add API keys or use a free local LLM — your choice</p>
        </div>
        <button onClick={handleTestAll} disabled={testingAll} className="btn-primary" style={{ padding:'10px 20px', fontSize:'.9rem', opacity:testingAll?.6:1 }}>
          {testingAll ? '⏳ Testing...' : '⚡ Test All'}
        </button>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'32px', maxWidth:820, width:'100%' }}>

        {/* Local LLM first — free option */}
        <LocalLlmSection />

        {/* Gemini */}
        <ServiceCard title="Google Gemini AI (Optional)" icon="🤖" status={connectionStatus.gemini} onTest={()=>handleTest('gemini')}>
          <Input label="Gemini API Key" keyName="geminiApiKey" placeholder="AIzaSy..." icon="🔑" description="Free key from aistudio.google.com/apikey — optional if using local LLM" />
          <div style={{ marginBottom:20 }}>
            <label style={{ fontWeight:500, fontSize:'.9rem', display:'block', marginBottom:12 }}>🧠 Model</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {GEMINI_MODELS.map(m => (
                <div key={m.value} onClick={()=>updateKey('modelName',m.value)} style={{ padding:14, borderRadius:10, cursor:'pointer', border:`1px solid ${keys.modelName===m.value?'var(--accent-border)':'var(--border)'}`, background:keys.modelName===m.value?'var(--accent-dim)':'var(--bg-tertiary)', transition:'all .2s' }}>
                  <div style={{ fontWeight:600, fontSize:'.9rem', color:keys.modelName===m.value?'var(--accent-bright)':'var(--text-primary)', marginBottom:4 }}>{keys.modelName===m.value?'✓ ':''}{m.label}</div>
                  <div style={{ fontSize:'.78rem', color:'var(--text-tertiary)' }}>{m.desc}</div>
                </div>
              ))}
            </div>
          </div>
          {testResults.gemini && (
            <div style={{ padding:'10px 14px', borderRadius:8, marginBottom:16, fontSize:'.85rem', background:testResults.gemini.success?'rgba(16,185,129,.08)':'rgba(239,68,68,.08)', border:`1px solid ${testResults.gemini.success?'rgba(16,185,129,.25)':'rgba(239,68,68,.25)'}`, color:testResults.gemini.success?'#10b981':'#ef4444' }}>
              {testResults.gemini.success?`✅ ${testResults.gemini.message}`:`❌ ${testResults.gemini.error}`}
            </div>
          )}
        </ServiceCard>

        {/* Supabase */}
        <ServiceCard title="Supabase (Database)" icon="🗄️" status={connectionStatus.supabase} onTest={()=>handleTest('supabase')}>
          <Input label="Supabase URL" keyName="supabaseUrl" placeholder="https://xxxx.supabase.co" icon="🌐" type="text" description="Settings → API in your Supabase dashboard" />
          <Input label="Supabase Anon Key" keyName="supabaseAnonKey" placeholder="sb_publishable_..." icon="🔑" description="The 'anon' key from Settings → API" />
        </ServiceCard>

        {/* Backend */}
        <ServiceCard title="AI Backend (FastAPI)" icon="⚙️" status={connectionStatus.backend} onTest={()=>handleTest('backend')} testLabel="Ping Backend">
          <Input label="Backend URL" keyName="backendUrl" placeholder="http://localhost:8000" icon="🔗" type="text" description="Local: http://localhost:8000 | Railway: https://your-app.railway.app" />
        </ServiceCard>

        {/* Privacy note */}
        <div className="glass" style={{ padding:'20px 24px', background:'rgba(124,58,237,.05)', borderColor:'var(--accent-border)' }}>
          <div style={{ display:'flex', gap:12 }}>
            <span style={{ fontSize:'1.3rem' }}>🔒</span>
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
