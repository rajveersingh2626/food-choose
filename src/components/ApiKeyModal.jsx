import React, { useState } from 'react';
import { testGeminiApiKey } from '../services/geminiService.js';
import { IconClose, IconCheck, IconSparkles, IconAlert } from './Icons.jsx';

export default function ApiKeyModal({ isOpen, onClose, currentKey, onSaveKey }) {
  if (!isOpen) return null;

  const [inputKey, setInputKey] = useState(currentKey || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // { ok: boolean, error?: string }

  const handleTestAndSave = async (e) => {
    e.preventDefault();
    if (!inputKey.trim()) return;

    setTesting(true);
    setTestResult(null);

    const res = await testGeminiApiKey(inputKey.trim());
    setTesting(false);
    setTestResult(res);

    if (res.ok) {
      onSaveKey(inputKey.trim());
      setTimeout(() => {
        onClose();
      }, 1200);
    }
  };

  const handleClear = () => {
    setInputKey('');
    setTestResult(null);
    onSaveKey('');
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 10, 20, 0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        className="card animate-fade"
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'white',
          borderRadius: '24px',
          padding: '28px 24px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          position: 'relative'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            border: 'none',
            background: '#F3F4F6',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <IconClose size={16} color="#4B5563" />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'var(--primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <IconSparkles size={20} color="var(--primary)" />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1F2421', margin: 0 }}>
            Connect Gemini AI (Free)
          </h2>
        </div>

        <p style={{ fontSize: '0.84rem', color: '#5C6460', marginBottom: '16px', lineHeight: '1.5' }}>
          Google Gemini is completely free for personal use with no credit card required.
        </p>

        {/* 3 Step Guide */}
        <div style={{
          background: '#FAF7F8',
          border: '1.5px solid var(--primary-border)',
          borderRadius: '16px',
          padding: '14px 16px',
          marginBottom: '18px',
          fontSize: '0.82rem',
          lineHeight: '1.55',
          color: '#374151'
        }}>
          <div style={{ fontWeight: '700', marginBottom: '6px', color: '#1F2421' }}>
            How to get your free key (30 seconds):
          </div>
          <ol style={{ margin: 0, paddingLeft: '18px' }}>
            <li style={{ marginBottom: '4px' }}>
              Go to{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                style={{ color: '#E7829A', fontWeight: '700', textDecoration: 'underline' }}
              >
                aistudio.google.com/app/apikey ↗
              </a>
            </li>
            <li style={{ marginBottom: '4px' }}>Log in with your Google account & click <strong>Create API Key</strong></li>
            <li>Paste your key below and click <strong>Save & Test</strong></li>
          </ol>
        </div>

        {/* Form */}
        <form onSubmit={handleTestAndSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#1F2421', display: 'block', marginBottom: '6px' }}>
              Gemini API Key
            </label>
            <input
              type="password"
              value={inputKey}
              onChange={(e) => {
                setInputKey(e.target.value);
                setTestResult(null);
              }}
              placeholder="AIzaSy..."
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1.5px solid rgba(0,0,0,0.12)',
                background: 'white',
                fontFamily: 'monospace',
                fontSize: '0.86rem'
              }}
            />
          </div>

          {/* Test feedback */}
          {testResult && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: testResult.ok ? '#ECFDF5' : '#FEF2F2',
              color: testResult.ok ? '#065F46' : '#991B1B',
              border: `1px solid ${testResult.ok ? '#A7F3D0' : '#FCA5A5'}`
            }}>
              {testResult.ok ? (
                <>
                  <IconCheck size={16} color="#059669" />
                  <span style={{ fontWeight: '700' }}>✓ Connected to Gemini AI successfully!</span>
                </>
              ) : (
                <>
                  <IconAlert size={16} color="#DC2626" />
                  <span><strong>Connection failed:</strong> {testResult.error || 'Invalid API key'}</span>
                </>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <button
              type="submit"
              disabled={testing || !inputKey.trim()}
              className="btn-primary"
              style={{ flex: 1, justifyContent: 'center', padding: '12px' }}
            >
              <IconSparkles size={16} />
              <span>{testing ? 'Testing Key...' : 'Save & Connect AI'}</span>
            </button>

            {currentKey && (
              <button
                type="button"
                onClick={handleClear}
                className="btn-outline"
                style={{ padding: '12px 16px', fontSize: '0.82rem' }}
                title="Disconnect key and use smart offline engine"
              >
                Disconnect
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
