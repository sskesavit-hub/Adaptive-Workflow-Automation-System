'use client';
import { useState, useEffect } from 'react';

const MOCK_INSIGHTS = [
  {
    type: 'theme',
    icon: '🔗',
    title: 'Common Theme Detected',
    body: 'Multiple documents reference "machine learning" and "neural networks". Consider creating a dedicated knowledge cluster.',
    docs: ['Research_Paper.pdf', 'Meeting_Notes.md'],
    color: 'var(--accent)',
  },
  {
    type: 'action',
    icon: '⚡',
    title: 'Action Items Found',
    body: 'Found 3 unresolved action items across your documents from the past week.',
    docs: ['Meeting_Notes.md'],
    color: '#f59e0b',
  },
  {
    type: 'summary',
    icon: '📊',
    title: 'Knowledge Summary',
    body: 'Your knowledge base covers 4 main topics: AI/ML, Project Management, Research, and Personal Notes.',
    docs: ['All documents'],
    color: '#10b981',
  },
];

function InsightCard({ insight, delay }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), delay); }, []);

  return (
    <div className="glass" style={{
      padding: '24px', opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(16px)',
      transition: 'all 0.5s ease',
      borderLeft: `3px solid ${insight.color}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <div style={{
          width: 44, height: 44, borderRadius: '10px', flexShrink: 0,
          background: `${insight.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.4rem', border: `1px solid ${insight.color}40`,
        }}>
          {insight.icon}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontWeight: 600, marginBottom: '8px', fontSize: '1rem' }}>{insight.title}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '12px' }}>
            {insight.body}
          </p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {insight.docs.map((d, i) => (
              <span key={i} style={{
                padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem',
                background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
              }}>📄 {d}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  useEffect(() => { setTimeout(() => setIsAnalyzing(false), 2000); }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{
        padding: '24px 32px', borderBottom: '1px solid var(--border)',
        background: 'rgba(8,8,15,0.8)', backdropFilter: 'blur(12px)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
      }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em' }}>AI Insights</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Patterns and connections discovered in your knowledge base
          </p>
        </div>
        <button className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
          ✨ Refresh Insights
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
        {isAnalyzing ? (
          <div style={{ textAlign: 'center', padding: '80px 32px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px', animation: 'spin 2s linear infinite' }}>⚙️</div>
            <p style={{ color: 'var(--text-secondary)' }}>Analyzing your knowledge base with Gemini AI...</p>
            <style>{`@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '800px' }}>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', marginBottom: '8px' }}>
              3 insights generated from your {3} documents
            </p>
            {MOCK_INSIGHTS.map((insight, i) => (
              <InsightCard key={i} insight={insight} delay={i * 150} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
