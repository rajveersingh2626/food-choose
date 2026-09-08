import React, { useState, useEffect } from 'react';
import { IconSmartphone, IconShare, IconPlus, IconClose, IconCheck, IconDownload } from './Icons.jsx';

export default function PwaInstallPrompt({ onClose, onInstalled }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running as standalone PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    setIsStandalone(standalone);

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua) && !window.MSStream;
    setIsIOS(isIosDevice);

    // Listen for native beforeinstallprompt (Chrome, Edge, Android)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      window.__pwaInstallPrompt = e;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Retrieve if already stored globally
    if (window.__pwaInstallPrompt) {
      setDeferredPrompt(window.__pwaInstallPrompt);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleNativeInstall = async () => {
    const promptEvent = deferredPrompt || window.__pwaInstallPrompt;
    if (!promptEvent) return;

    promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === 'accepted') {
      if (onInstalled) onInstalled();
      if (onClose) onClose();
    }
    setDeferredPrompt(null);
    window.__pwaInstallPrompt = null;
  };

  if (isStandalone) {
    return (
      <div
        className="card animate-fade"
        style={{
          background: '#F0FDF4',
          border: '1.5px solid #86EFAC',
          padding: '16px',
          borderRadius: '18px',
          textAlign: 'center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#166534', fontWeight: '800' }}>
          <IconCheck size={18} color="#166534" />
          <span>App is Installed & Running in Native Mode!</span>
        </div>
        <p style={{ fontSize: '0.78rem', color: '#15803D', margin: '6px 0 0 0' }}>
          You're enjoying full offline caching, instant load times, and standalone app immersion.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={(e) => e.target === e.currentTarget && onClose && onClose()}
    >
      <div
        className="card animate-fade"
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '24px',
          borderRadius: '24px',
          position: 'relative',
          background: 'white',
          boxShadow: '0 20px 50px rgba(0,0,0,0.25)'
        }}
      >
        {/* Close */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: '#F3F4F6',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <IconClose size={16} color="#6B7280" />
          </button>
        )}

        {/* Header with App Icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #F093A9 0%, #E7829A 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(231, 130, 154, 0.4)',
            flexShrink: 0
          }}>
            <IconSmartphone size={28} color="white" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1F2421', margin: 0, lineHeight: '1.2' }}>
              Install Suhanu Food AI
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#6B7280', margin: '3px 0 0 0' }}>
              Add to your phone or tablet home screen
            </p>
          </div>
        </div>

        {/* Feature bullets */}
        <div style={{
          background: '#FAF7F8',
          border: '1px solid var(--primary-border)',
          borderRadius: '14px',
          padding: '12px 14px',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          fontSize: '0.82rem',
          color: '#4B5563'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--primary)', fontWeight: '800' }}>✓</span>
            <span>Opens like a real app without browser toolbars</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--primary)', fontWeight: '800' }}>✓</span>
            <span>Works offline & loads cached recipes instantaneously</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--primary)', fontWeight: '800' }}>✓</span>
            <span>One tap access to your grocery list & weekly planner</span>
          </div>
        </div>

        {/* Dynamic Instructions: Native vs iOS */}
        {isIOS ? (
          <div>
            <div style={{ fontSize: '0.84rem', fontWeight: '700', color: '#1F2421', marginBottom: '10px' }}>
              How to install on iOS / iPadOS:
            </div>
            <ol style={{ paddingLeft: '18px', fontSize: '0.82rem', color: '#4B5563', lineHeight: '1.6', margin: 0 }}>
              <li style={{ marginBottom: '6px' }}>
                Tap the <strong>Share button</strong> <IconShare size={13} color="#2563EB" /> in Safari's bottom toolbar.
              </li>
              <li style={{ marginBottom: '6px' }}>
                Scroll down in the share menu and select <strong>"Add to Home Screen"</strong> <IconPlus size={13} color="#059669" />.
              </li>
              <li>
                Tap <strong>Add</strong> in the top right corner. The app will appear on your home screen!
              </li>
            </ol>
            <button
              type="button"
              onClick={onClose}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '18px', padding: '11px' }}
            >
              Got it!
            </button>
          </div>
        ) : deferredPrompt || window.__pwaInstallPrompt ? (
          <div>
            <button
              type="button"
              onClick={handleNativeInstall}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '0.94rem' }}
            >
              <IconDownload size={18} />
              <span>Install to Device (1-Click)</span>
            </button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '0.84rem', fontWeight: '700', color: '#1F2421', marginBottom: '8px' }}>
              How to install on Android / Chrome:
            </div>
            <p style={{ fontSize: '0.82rem', color: '#4B5563', lineHeight: '1.5', margin: 0 }}>
              Tap the browser menu (three dots in top right) and select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '16px', padding: '10px' }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
