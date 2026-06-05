'use client';
import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useApiKeys } from '@/context/ApiKeysContext';

const Avatar3D = dynamic(() => import('@/components/Avatar3D'), { ssr: false });

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: "Hello! I'm your AI knowledge assistant. Ask me anything about your uploaded documents and I'll find precise answers from your knowledge base.",
  timestamp: new Date().toISOString(),
};

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{
      display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '16px', gap: '10px', alignItems: 'flex-end',
    }}>
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--accent), var(--cyan))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
        }}>🧠</div>
      )}
      <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{
          padding: '12px 16px',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          background: isUser ? 'linear-gradient(135deg, var(--accent), var(--accent-bright))' : 'var(--bg-tertiary)',
          border: isUser ? 'none' : '1px solid var(--border)',
          color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: '1.6',
          boxShadow: isUser ? '0 4px 16px var(--accent-glow)' : 'var(--shadow-sm)',
          whiteSpace: 'pre-wrap',
        }}>
          {msg.content}
        </div>
        {msg.sources && msg.sources.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {msg.sources.map((src, i) => (
              <span key={i} style={{
                padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 500,
                background: 'var(--cyan-dim)', border: '1px solid rgba(6,182,212,0.3)', color: 'var(--cyan)',
              }}>📄 {src}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', marginBottom: '16px' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--accent), var(--cyan))',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0,
      }}>🧠</div>
      <div style={{
        padding: '14px 18px', borderRadius: '16px 16px 16px 4px',
        background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
        display: 'flex', gap: '6px', alignItems: 'center',
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-bright)',
            animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0);opacity:.5}40%{transform:translateY(-8px);opacity:1}}`}</style>
    </div>
  );
}

export default function ChatPage() {
  const { keys, connectionStatus } = useApiKeys();
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messages, isLoading]);

  const geminiReady = !!keys.geminiApiKey;

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = { role: 'user', content: input, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          apiKey: keys.geminiApiKey,
          modelName: keys.modelName,
          backendUrl: keys.backendUrl,
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer || data.error || 'Something went wrong.',
        sources: data.sources || [],
        timestamp: new Date().toISOString(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant', content: 'Failed to connect. Please check your API keys in Settings.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* 3D Avatar Panel */}
      <div style={{
        width: '340px', flexShrink: 0,
        borderRight: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '24px 16px', gap: '16px',
      }}>
        <h2 style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          AI Knowledge Assistant
        </h2>

        <div style={{ width: '100%', height: '300px', borderRadius: '16px', overflow: 'hidden' }}>
          <Avatar3D isSpeaking={isLoading} isThinking={isLoading} />
        </div>

        {/* Status */}
        <div style={{
          width: '100%', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px',
          background: isLoading ? 'rgba(245,158,11,0.08)' : geminiReady ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
          border: `1px solid ${isLoading ? 'rgba(245,158,11,0.25)' : geminiReady ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
            background: isLoading ? '#f59e0b' : geminiReady ? '#10b981' : '#ef4444',
            animation: isLoading ? 'pulse 1s ease infinite' : 'none',
          }} />
          <div style={{ fontSize: '0.82rem' }}>
            <div style={{ fontWeight: 500, color: isLoading ? '#f59e0b' : geminiReady ? '#10b981' : '#ef4444' }}>
              {isLoading ? 'Searching knowledge base...' : geminiReady ? 'Ready to answer' : 'Gemini API key missing'}
            </div>
            <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
              Model: {keys.modelName || 'gemini-1.5-flash'}
            </div>
          </div>
        </div>

        {/* Warning if no key */}
        {!geminiReady && (
          <Link href="/settings" style={{ width: '100%', textDecoration: 'none' }}>
            <div style={{
              width: '100%', padding: '12px 16px', borderRadius: '12px', cursor: 'pointer',
              background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
              color: 'var(--accent-bright)', fontSize: '0.85rem', fontWeight: 500, textAlign: 'center',
            }}>
              ⚙️ Add Gemini API Key in Settings
            </div>
          </Link>
        )}
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      </div>

      {/* Chat Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{
          padding: '20px 32px', borderBottom: '1px solid var(--border)',
          background: 'rgba(8,8,15,0.8)', backdropFilter: 'blur(12px)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 600 }}>AI Knowledge Chat</h1>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginTop: '4px' }}>
              Ask questions about your documents
            </p>
          </div>
          <Link href="/settings">
            <button style={{
              padding: '8px 14px', borderRadius: '8px', fontSize: '0.8rem',
              background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', cursor: 'pointer',
            }}>⚙️ Settings</button>
          </Link>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
          {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
          {isLoading && <ThinkingBubble />}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ padding: '16px 32px', borderTop: '1px solid var(--border)', background: 'rgba(8,8,15,0.9)' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={geminiReady ? 'Ask anything about your documents... (Enter to send)' : 'Add your Gemini API key in Settings first...'}
              disabled={!geminiReady}
              rows={1}
              style={{
                flex: 1, padding: '14px 18px',
                background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                borderRadius: '14px', color: 'var(--text-primary)',
                fontSize: '0.95rem', resize: 'none', outline: 'none',
                fontFamily: 'inherit', lineHeight: '1.5', transition: 'border-color 0.2s',
                opacity: geminiReady ? 1 : 0.6,
              }}
              onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim() || !geminiReady}
              className="btn-primary"
              style={{
                padding: '14px 24px', borderRadius: '14px', fontSize: '0.95rem',
                opacity: isLoading || !input.trim() || !geminiReady ? 0.5 : 1,
                cursor: isLoading || !input.trim() || !geminiReady ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading ? '...' : '↑ Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
