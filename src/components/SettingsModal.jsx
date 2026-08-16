import React from 'react';
import { IconClose, IconSparkles, IconRefresh } from './Icons.jsx';

export default function SettingsModal({ isOpen, onClose, apiKey, setApiKey, onResetAll }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.45)',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
      zIndex: 2500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div className="card animate-fade" style={{ width: '100%', maxWidth: '440px', background: 'white', borderRadius: '24px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.15rem', color: '#1F2421', margin: 0, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconSparkles size={20} color="var(--primary)" />
            <span>AI Engine Configuration</span>
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <IconClose size={20} color="#1F2421" />
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: '#5C6460', marginBottom: '16px', lineHeight: '1.45' }}>
          The app includes an automatic <strong>Offline Smart AI Engine</strong> that works out of the box! If you want live Gemini 1.5 LLM generation, paste your Gemini API key below:
        </p>

        <div className="mb-4">
          <label style={{ fontSize: '0.82rem', fontWeight: '700', color: '#1F2421', display: 'block', marginBottom: '6px' }}>
            Google Gemini API Key (Optional):
          </label>
          <input
            type="password"
            placeholder="AIzaSy..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={{
              width: '100%',
              fontSize: '0.88rem',
              marginBottom: '6px'
            }}
          />
          <div style={{ fontSize: '0.75rem', color: apiKey ? '#2E7D32' : '#D97706', fontWeight: '600' }}>
            {apiKey ? '✓ Gemini LLM Connected' : 'Smart Offline AI Engine Active'}
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '16px', marginBottom: '16px' }}>
          <button
            onClick={() => {
              if (window.confirm('Reset pantry and restore Suhanu\'s default list?')) {
                onResetAll();
                onClose();
              }
            }}
            className="btn-outline"
            style={{ width: '100%', color: '#EF4444', borderColor: '#FCA5A5', justifyContent: 'center' }}
          >
            <IconRefresh size={16} />
            <span>Restore Suhanu's Starter List</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
        >
          Save & Close
        </button>
      </div>
    </div>
  );
}
