import React from 'react';
import { IconSliders, IconSmartphone } from './Icons.jsx';
import PantryContextSelector from './PantryContextSelector.jsx';

export default function Header({
  apiOk,
  onOpenApiKeyModal,
  onOpenInstallModal,
  activePresetId,
  onSelectPreset,
  pantryItems,
  activePantryItems
}) {
  return (
    <header className="card" style={{ padding: '16px 24px', borderRadius: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Logo */}
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #F093A9 0%, #E7829A 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '800',
            fontSize: '1.3rem',
            fontFamily: 'Outfit, sans-serif',
            boxShadow: '0 4px 12px rgba(231, 130, 154, 0.4)',
            flexShrink: 0
          }}>
            S
          </div>

          <div>
            <h1 style={{ fontSize: '1.35rem', color: '#1F2421', lineHeight: '1.2', margin: 0, fontWeight: '800' }}>
              Suhanu's Culinary Companion
            </h1>
            <p style={{ fontSize: '0.78rem', color: '#5C6460', margin: 0, marginTop: '2px' }}>
              Powered by Gemini AI · Personalised for your pantry
            </p>
          </div>
        </div>

        {/* Right Controls: Pantry Context Selector + Install App + AI Key Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <PantryContextSelector
            activePresetId={activePresetId}
            onSelectPreset={onSelectPreset}
            pantryItems={pantryItems}
            activePantryItems={activePantryItems}
          />

          {/* Install PWA Button */}
          <button
            type="button"
            onClick={onOpenInstallModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '999px',
              background: '#FAF5FF',
              border: '1.5px solid #E9D5FF',
              fontSize: '0.76rem',
              fontWeight: '700',
              color: '#7E22CE',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
            }}
            title="Install app to your home screen"
          >
            <IconSmartphone size={13} color="#7E22CE" />
            <span>Install App</span>
          </button>

          {/* AI Status Pill (Interactive button to configure key) */}
          <button
            type="button"
            onClick={onOpenApiKeyModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 16px',
              borderRadius: '999px',
              background: apiOk ? '#E4F1E7' : '#FEF3C7',
              border: `1.5px solid ${apiOk ? '#B8DEC0' : '#FDE68A'}`,
              fontSize: '0.76rem',
              fontWeight: '700',
              color: apiOk ? '#2E7D32' : '#D97706',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
            }}
            title="Click to view or update your Gemini API key"
          >
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: apiOk ? '#4CAF50' : '#F59E0B',
              animation: apiOk ? 'pulse 2s infinite' : 'none'
            }} />
            <IconSliders size={13} color={apiOk ? '#2E7D32' : '#D97706'} />
            <span>{apiOk ? 'Gemini AI Active' : 'Connect Gemini AI'}</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </header>
  );
}
