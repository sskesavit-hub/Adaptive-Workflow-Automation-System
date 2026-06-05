'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const features = [
  {
    icon: '🧠',
    title: 'AI-Powered Search',
    description: 'Ask natural language questions and get precise answers extracted from your documents.',
  },
  {
    icon: '📄',
    title: 'Multi-Format Ingestion',
    description: 'PDFs, images, notes, emails — OCR and text extraction handles everything.',
  },
  {
    icon: '🔒',
    title: 'Complete Privacy',
    description: 'Your data stays in your private Supabase instance. Nothing is shared or sold.',
  },
  {
    icon: '💡',
    title: 'Contextual Insights',
    description: 'AI surfaces patterns, connections, and insights you never knew existed in your notes.',
  },
];

const stats = [
  { value: '50+', label: 'File formats' },
  { value: '< 2s', label: 'Query response' },
  { value: '100%', label: 'Data private' },
  { value: '∞', label: 'Documents' },
];

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <main style={{ minHeight: '100vh', position: 'relative', zIndex: 1, overflow: 'hidden' }}>
      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 48px',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(3, 3, 10, 0.8)',
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--accent), var(--cyan))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', boxShadow: '0 0 20px var(--accent-glow)'
          }}>🧠</div>
          <span style={{ fontWeight: 700, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>NeuralVault</span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/sign-in">
            <button className="btn-secondary" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>Sign In</button>
          </Link>
          <Link href="/sign-up">
            <button className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>Get Started Free</button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        paddingTop: '160px', paddingBottom: '100px', textAlign: 'center',
        padding: '180px 24px 100px',
        opacity: mounted ? 1 : 0, transition: 'opacity 0.6s ease',
      }}>
        {/* Glow orb */}
        <div style={{
          position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
          width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '8px 16px', borderRadius: '100px',
          background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
          fontSize: '0.85rem', color: 'var(--accent-bright)',
          marginBottom: '32px', fontWeight: 500,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-bright)', display: 'inline-block' }} />
          Powered by Gemini AI & LangChain RAG
        </div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 6vw, 5rem)',
          fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1,
          marginBottom: '24px', maxWidth: '900px', margin: '0 auto 24px',
        }}>
          Your Personal AI <br />
          <span className="gradient-text">Knowledge Brain</span>
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.25rem)',
          color: 'var(--text-secondary)', maxWidth: '600px',
          margin: '0 auto 48px', lineHeight: 1.7,
        }}>
          Upload any document, ask any question. NeuralVault uses AI to index your personal knowledge base and surface the exact answers you need — with complete privacy.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/sign-up">
            <button className="btn-primary" style={{ padding: '16px 32px', fontSize: '1.05rem', borderRadius: '14px' }}>
              Start Building Your Brain →
            </button>
          </Link>
          <Link href="#features">
            <button className="btn-secondary" style={{ padding: '16px 32px', fontSize: '1.05rem', borderRadius: '14px' }}>
              See How It Works
            </button>
          </Link>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'flex', gap: '48px', justifyContent: 'center',
          marginTop: '80px', flexWrap: 'wrap',
        }}>
          {stats.map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, background: 'linear-gradient(135deg, var(--accent-bright), var(--cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.value}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: '80px 48px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2.5rem', fontWeight: 700, marginBottom: '16px', letterSpacing: '-0.03em' }}>
          Everything Your Knowledge Needs
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '64px', fontSize: '1.1rem' }}>
          A complete AI-powered system built on battle-tested open-source technology.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
          {features.map((f, i) => (
            <div key={i} className="glass" style={{
              padding: '32px',
              transition: 'all 0.3s ease',
              cursor: 'default',
              animationDelay: `${i * 0.1}s`,
            }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent-border)';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>{f.icon}</div>
              <h3 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '10px' }}>{f.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 48px', textAlign: 'center' }}>
        <div className="glass" style={{
          maxWidth: '700px', margin: '0 auto', padding: '64px 48px',
          background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(6,182,212,0.05))',
          borderColor: 'var(--accent-border)',
          boxShadow: 'var(--shadow-glow)',
        }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 700, marginBottom: '16px', letterSpacing: '-0.03em' }}>
            Ready to build your <span className="gradient-text">AI brain</span>?
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '1.05rem' }}>
            Get started in minutes. Upload your first document and ask a question.
          </p>
          <Link href="/sign-up">
            <button className="btn-primary" style={{ padding: '16px 40px', fontSize: '1.05rem', borderRadius: '14px' }}>
              Get Started — It's Free
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)', padding: '32px 48px',
        textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem',
      }}>
        © 2025 NeuralVault — Built with Gemini AI, LangChain, Supabase & Next.js
      </footer>
    </main>
  );
}
