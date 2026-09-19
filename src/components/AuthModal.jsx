import React, { useState } from 'react';
import { IconClose, IconSparkles, IconUser } from './Icons.jsx';
import { supabaseService } from '../services/supabaseService.js';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'register') {
        if (!email.trim() || !password.trim() || !fullName.trim()) {
          throw new Error('Please fill in all required fields.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        const data = await supabaseService.signUp(email.trim(), password, fullName.trim(), city);
        setSuccessMsg('Account created successfully! Logging you in...');
        setTimeout(() => {
          onAuthSuccess(data?.user || { email, user_metadata: { full_name: fullName } });
          onClose();
        }, 1200);
      } else {
        if (!email.trim() || !password.trim()) {
          throw new Error('Please provide email and password.');
        }
        const data = await supabaseService.signInWithEmail(email.trim(), password);
        setSuccessMsg('Welcome back! Loading your kitchen...');
        setTimeout(() => {
          onAuthSuccess(data?.user);
          onClose();
        }, 800);
      }
    } catch (err) {
      console.error('Auth error:', err);
      // Helpful fallback note if credentials aren't deployed yet
      if (err.message?.includes('placeholder') || err.message?.includes('Failed to fetch') || err.message?.includes('Invalid API key')) {
        setErrorMsg('Supabase credentials not yet connected. You can explore as a guest or configure .env!');
      } else {
        setErrorMsg(err.message || 'Authentication failed. Please check credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider) => {
    try {
      setLoading(true);
      setErrorMsg('');
      await supabaseService.signInWithOAuth(provider);
    } catch (err) {
      setErrorMsg(err.message || 'OAuth sign in failed.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      zIndex: 2600,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div className="card animate-fade" style={{
        width: '100%',
        maxWidth: '440px',
        background: 'white',
        borderRadius: '24px',
        padding: '28px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
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
          <IconClose size={18} color="#4B5563" />
        </button>

        {/* Header Icon & Title */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #F093A9 0%, #E7829A 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            marginBottom: '12px',
            boxShadow: '0 6px 16px rgba(231, 130, 154, 0.35)'
          }}>
            <IconUser size={26} color="white" />
          </div>
          <h2 style={{ fontSize: '1.4rem', color: '#1F2421', margin: 0, fontWeight: '800' }}>
            {mode === 'register' ? 'Create Your Account' : 'Welcome to Suhanu'}
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#5C6460', margin: '4px 0 0' }}>
            {mode === 'register'
              ? 'Sync pantry, share meal plans with your partner & save recipes.'
              : 'Sign in to access your shared kitchen & smart pantry.'}
          </p>
        </div>

        {/* Mode Tabs */}
        <div style={{
          display: 'flex',
          background: '#F3F4F6',
          borderRadius: '12px',
          padding: '4px',
          marginBottom: '20px'
        }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(''); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '9px',
              border: 'none',
              background: mode === 'login' ? 'white' : 'transparent',
              fontWeight: '700',
              fontSize: '0.84rem',
              color: mode === 'login' ? '#1F2421' : '#6B7280',
              boxShadow: mode === 'login' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMsg(''); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '9px',
              border: 'none',
              background: mode === 'register' ? 'white' : 'transparent',
              fontWeight: '700',
              fontSize: '0.84rem',
              color: mode === 'register' ? '#1F2421' : '#6B7280',
              boxShadow: mode === 'register' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Create Account
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '10px',
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: '#DC2626',
            fontSize: '0.82rem',
            marginBottom: '16px',
            lineHeight: '1.4'
          }}>
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '10px',
            background: '#ECFDF5',
            border: '1px solid #A7F3D0',
            color: '#059669',
            fontSize: '0.82rem',
            marginBottom: '16px',
            lineHeight: '1.4'
          }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {mode === 'register' && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#374151', marginBottom: '5px' }}>
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suhanu"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #E5E7EB',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#374151', marginBottom: '5px' }}>
                  City / Location (for local grocery & quick-commerce recommendations)
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #E5E7EB',
                    fontSize: '0.9rem',
                    outline: 'none',
                    background: 'white',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="Mumbai">Mumbai</option>
                  <option value="Delhi">Delhi / NCR</option>
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Pune">Pune</option>
                  <option value="New York">New York</option>
                  <option value="London">London</option>
                  <option value="Other">Other / Global</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#374151', marginBottom: '5px' }}>
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1.5px solid #E5E7EB',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#374151', marginBottom: '5px' }}>
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1.5px solid #E5E7EB',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              justifyContent: 'center',
              fontSize: '0.92rem',
              fontWeight: '700',
              marginTop: '6px',
              cursor: loading ? 'wait' : 'pointer'
            }}
          >
            {loading ? 'Please wait...' : mode === 'register' ? 'Create Account & Kitchen' : 'Sign In to Kitchen'}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          margin: '18px 0',
          gap: '12px',
          color: '#9CA3AF',
          fontSize: '0.78rem'
        }}>
          <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
          <span>OR</span>
          <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={() => handleOAuth('google')}
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: '12px',
            border: '1.5px solid #E5E7EB',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            fontSize: '0.86rem',
            fontWeight: '600',
            color: '#374151',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Continue with Google</span>
        </button>
      </div>
    </div>
  );
}
