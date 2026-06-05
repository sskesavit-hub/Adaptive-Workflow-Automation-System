'use client';
import { useState, useRef } from 'react';
import { useUser } from '@clerk/nextjs';

const ACCEPT_TYPES = '.pdf,.txt,.md,.png,.jpg,.jpeg,.docx';

function UploadZone({ onUpload, isUploading }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef();

  const handleDrop = e => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onUpload(files);
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      style={{
        border: `2px dashed ${dragOver ? 'var(--accent-bright)' : 'var(--border)'}`,
        borderRadius: '16px', padding: '48px 32px', textAlign: 'center',
        background: dragOver ? 'var(--accent-dim)' : 'transparent',
        cursor: 'pointer', transition: 'all 0.2s ease',
        marginBottom: '32px',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT_TYPES}
        style={{ display: 'none' }}
        onChange={e => { const files = Array.from(e.target.files); if (files.length) onUpload(files); }}
      />
      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>
        {isUploading ? '⏳' : '📂'}
      </div>
      <p style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '8px' }}>
        {isUploading ? 'Uploading & Processing...' : 'Drop files here or click to browse'}
      </p>
      <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
        Supports PDF, TXT, Markdown, Images (JPG/PNG), DOCX
      </p>
    </div>
  );
}

function DocumentCard({ doc, onDelete }) {
  const typeEmoji = {
    'pdf': '📄', 'txt': '📝', 'md': '📋', 'docx': '📃',
    'png': '🖼️', 'jpg': '🖼️', 'jpeg': '🖼️',
  };
  const ext = doc.name.split('.').pop()?.toLowerCase();

  return (
    <div className="glass" style={{
      padding: '20px', display: 'flex', alignItems: 'center', gap: '16px',
      transition: 'all 0.2s ease',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: '12px', flexShrink: 0,
        background: 'var(--accent-dim)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: '1.5rem', border: '1px solid var(--accent-border)',
      }}>
        {typeEmoji[ext] || '📄'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 500, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {doc.name}
        </p>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', marginTop: '4px' }}>
          {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : 'Unknown size'} •{' '}
          {new Date(doc.created_at || Date.now()).toLocaleDateString()}
        </p>
      </div>
      <div style={{
        padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
        background: doc.status === 'ready' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
        color: doc.status === 'ready' ? '#10b981' : '#f59e0b',
        border: `1px solid ${doc.status === 'ready' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
      }}>
        {doc.status === 'ready' ? '✓ Indexed' : '⟳ Processing'}
      </div>
      <button
        onClick={() => onDelete(doc.id)}
        style={{
          padding: '8px', background: 'transparent', border: '1px solid var(--border)',
          borderRadius: '8px', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '1rem',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
      >🗑️</button>
    </div>
  );
}

export default function KnowledgeBasePage() {
  const { user } = useUser();
  const [documents, setDocuments] = useState([
    { id: '1', name: 'Project_Proposal.pdf', status: 'ready', size: 245000, created_at: new Date().toISOString() },
    { id: '2', name: 'Meeting_Notes.md', status: 'ready', size: 12000, created_at: new Date().toISOString() },
    { id: '3', name: 'Research_Paper.pdf', status: 'processing', size: 1200000, created_at: new Date().toISOString() },
  ]);
  const [isUploading, setIsUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');

  const handleUpload = async (files) => {
    setIsUploading(true);
    setUploadStatus('');
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', user?.id || 'demo');

        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();

        if (res.ok) {
          setDocuments(prev => [...prev, {
            id: data.id || Date.now().toString(),
            name: file.name,
            status: 'processing',
            size: file.size,
            created_at: new Date().toISOString(),
          }]);
          setUploadStatus(`✅ ${file.name} uploaded successfully`);
        } else {
          setUploadStatus(`❌ ${data.error || 'Upload failed'}`);
        }
      } catch {
        setUploadStatus(`⚠️ Backend offline — document added locally only`);
        setDocuments(prev => [...prev, {
          id: Date.now().toString(),
          name: file.name, status: 'ready',
          size: file.size, created_at: new Date().toISOString(),
        }]);
      }
    }
    setIsUploading(false);
  };

  const handleDelete = (id) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  const filtered = documents.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '24px 32px', borderBottom: '1px solid var(--border)',
        background: 'rgba(8,8,15,0.8)', backdropFilter: 'blur(12px)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
      }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Knowledge Base</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginTop: '4px' }}>
            {documents.length} documents indexed
          </p>
        </div>
        <div style={{
          padding: '8px 16px', borderRadius: '100px',
          background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
          color: 'var(--accent-bright)', fontSize: '0.85rem', fontWeight: 500,
        }}>
          🧠 {documents.filter(d => d.status === 'ready').length} in vector store
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
        <UploadZone onUpload={handleUpload} isUploading={isUploading} />

        {uploadStatus && (
          <div style={{
            padding: '12px 16px', borderRadius: '10px', marginBottom: '24px',
            background: uploadStatus.startsWith('✅') ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
            border: `1px solid ${uploadStatus.startsWith('✅') ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
            color: uploadStatus.startsWith('✅') ? '#10b981' : '#f59e0b', fontSize: '0.9rem',
          }}>
            {uploadStatus}
          </div>
        )}

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Search documents..."
          style={{
            width: '100%', padding: '12px 16px', marginBottom: '20px',
            background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
            borderRadius: '10px', color: 'var(--text-primary)',
            fontSize: '0.95rem', outline: 'none',
          }}
        />

        {/* Document list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '40px' }}>
              No documents found
            </div>
          ) : (
            filtered.map(doc => <DocumentCard key={doc.id} doc={doc} onDelete={handleDelete} />)
          )}
        </div>
      </div>
    </div>
  );
}
