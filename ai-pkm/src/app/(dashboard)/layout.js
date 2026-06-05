'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { ApiKeysProvider, useApiKeys } from '@/context/ApiKeysContext';

const NAV_ITEMS = [
  { href: '/knowledge-base', icon: '📚', label: 'Knowledge Base' },
  { href: '/chat', icon: '💬', label: 'AI Chat' },
  { href: '/insights', icon: '✨', label: 'Insights' },
  { href: '/settings', icon: '⚙️', label: 'Settings' },
];

function StatusDot() {
  const { connectionStatus } = useApiKeys();
  const allConnected = Object.values(connectionStatus).every(s => s === 'connected');
  const anyConnected = Object.values(connectionStatus).some(s => s === 'connected');
  const anyError = Object.values(connectionStatus).some(s => s === 'error');

  const color = allConnected ? '#10b981' : anyError ? '#ef4444' : anyConnected ? '#f59e0b' : '#6b7280';
  return (
    <div style={{
      width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0,
      boxShadow: anyConnected ? `0 0 8px ${color}` : 'none',
    }} />
  );
}

function Sidebar({ collapsed, setCollapsed }) {
  const pathname = usePathname();
  const { connectionStatus } = useApiKeys();
  const anyIssue = Object.values(connectionStatus).some(s => s === 'error' || s === 'unknown');

  return (
    <aside style={{
      width: collapsed ? '72px' : '260px',
      transition: 'width 0.25s ease',
      borderRight: '1px solid var(--border)',
      background: 'rgba(8, 8, 15, 0.95)',
      backdropFilter: 'blur(20px)',
      display: 'flex', flexDirection: 'column',
      padding: '24px 16px',
      zIndex: 20, flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        marginBottom: '40px', padding: '0 8px', overflow: 'hidden',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: 'linear-gradient(135deg, var(--accent), var(--cyan))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', boxShadow: '0 0 20px var(--accent-glow)',
        }}>🧠</div>
        {!collapsed && (
          <span style={{ fontWeight: 700, fontSize: '1.1rem', whiteSpace: 'nowrap', letterSpacing: '-0.02em' }}>
            NeuralVault
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href;
          const isSettings = item.href === '/settings';
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px', borderRadius: '10px', overflow: 'hidden',
                background: active ? 'rgba(124,58,237,0.15)' : 'transparent',
                border: `1px solid ${active ? 'var(--accent-border)' : 'transparent'}`,
                color: active ? 'var(--accent-bright)' : 'var(--text-secondary)',
                fontWeight: active ? 600 : 400,
                transition: 'all 0.2s ease', cursor: 'pointer', fontSize: '0.95rem',
                justifyContent: 'space-between',
              }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{item.icon}</span>
                  {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
                </div>
                {/* Alert dot on Settings if any key is not configured */}
                {isSettings && anyIssue && !collapsed && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 8px #f59e0b' }} />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* AI Status */}
      {!collapsed && (
        <div style={{
          padding: '12px', borderRadius: '10px', background: 'var(--bg-tertiary)',
          border: '1px solid var(--border)', marginBottom: '12px',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <StatusDot />
          <div style={{ fontSize: '0.8rem' }}>
            <div style={{ fontWeight: 500 }}>AI Services</div>
            <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
              {Object.values(connectionStatus).filter(s => s === 'connected').length}/3 connected
            </div>
          </div>
        </div>
      )}

      {/* Bottom */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button onClick={() => setCollapsed(!collapsed)} style={{
          display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
          gap: '10px', padding: '10px 12px', borderRadius: '8px',
          background: 'transparent', border: '1px solid var(--border)',
          color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '0.85rem',
          transition: 'all 0.2s',
        }}>
          <span>{collapsed ? '→' : '←'}</span>
          {!collapsed && <span>Collapse</span>}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px' }}>
          <UserButton appearance={{ elements: { avatarBox: { width: 32, height: 32 } } }} />
          {!collapsed && <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Account</span>}
        </div>
      </div>
    </aside>
  );
}

export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <ApiKeysProvider>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {children}
        </main>
      </div>
    </ApiKeysProvider>
  );
}
