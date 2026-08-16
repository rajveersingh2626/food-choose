import React from 'react';

export default function Header({ onOpenSettings, apiKey }) {
  return (
    <header className="glass-card mb-4 p-4 flex items-center justify-between" style={{ borderRadius: '24px', background: 'rgba(255, 255, 255, 0.9)' }}>
      <div className="flex items-center gap-3">
        <div style={{
          width: '46px',
          height: '46px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FFE5EC 0%, #E794A7 100%)',
          display: 'flex',
          align-items: 'center',
          justify-content: 'center',
          fontSize: '1.4rem',
          boxShadow: '0 4px 12px rgba(231, 148, 167, 0.3)'
        }}>
          👩‍🍳
        </div>
        <div>
          <h1 style={{ fontSize: '1.35rem', color: '#33272A', lineHeight: '1.2', margin: 0 }}>
            Suhanu's Kitchen 🌸
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#6B5B60', margin: 0 }}>
            Made with ❤️ for you • {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>

      <button
        onClick={onOpenSettings}
        className="btn-outline flex items-center gap-1"
        style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '20px' }}
      >
        <span>🤖 AI Engine</span>
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: apiKey ? '#4CAF50' : '#FF9800',
          display: 'inline-block'
        }} />
      </button>
    </header>
  );
}
