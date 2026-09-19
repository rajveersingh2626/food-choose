import React, { useState, useEffect } from 'react';
import { IconClose, IconUser, IconUsers, IconCopy, IconCheck, IconLogOut } from './Icons.jsx';
import { supabaseService } from '../services/supabaseService.js';

export default function AccountModal({ isOpen, onClose, user, onSignOut, onHouseholdChanged }) {
  const [profile, setProfile] = useState(null);
  const [partnerCode, setPartnerCode] = useState('');
  const [joinStatus, setJoinStatus] = useState('');
  const [copied, setCopied] = useState(false);
  const [loadingJoin, setLoadingJoin] = useState(false);

  useEffect(() => {
    if (isOpen && user?.id) {
      supabaseService.getUserProfile(user.id)
        .then(data => setProfile(data))
        .catch(err => console.warn('Could not load profile from Supabase:', err));
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Foodie';
  const displayEmail = user?.email || 'Guest User';
  const household = profile?.households;
  const inviteCode = household?.invite_code || 'DEMO88';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinHousehold = async (e) => {
    e.preventDefault();
    if (!partnerCode.trim()) return;

    setLoadingJoin(true);
    setJoinStatus('');

    try {
      const res = await supabaseService.joinHouseholdByInviteCode(partnerCode.trim());
      setJoinStatus(`✓ Successfully joined ${res.household?.name || 'partner kitchen'}!`);
      setPartnerCode('');
      // Reload profile
      if (user?.id) {
        const updated = await supabaseService.getUserProfile(user.id);
        setProfile(updated);
      }
      if (onHouseholdChanged) onHouseholdChanged();
    } catch (err) {
      setJoinStatus(`Error: ${err.message || 'Could not join household'}`);
    } finally {
      setLoadingJoin(false);
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
        maxWidth: '460px',
        background: 'white',
        borderRadius: '24px',
        padding: '28px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
        position: 'relative'
      }}>
        {/* Close */}
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

        {/* User Card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '22px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #F093A9 0%, #E7829A 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '800',
            fontSize: '1.4rem',
            fontFamily: 'Outfit, sans-serif'
          }}>
            {displayName[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', color: '#1F2421', margin: 0, fontWeight: '800' }}>
              {displayName}
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#6B7280', margin: '2px 0 0' }}>
              {displayEmail} {profile?.city ? `· ${profile.city}` : ''}
            </p>
          </div>
        </div>

        {/* Kitchen & Partner Sharing Section */}
        <div style={{
          background: '#F9FAFB',
          border: '1.5px solid #E5E7EB',
          borderRadius: '16px',
          padding: '18px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <IconUsers size={18} color="#E7829A" />
            <h4 style={{ margin: 0, fontSize: '0.92rem', color: '#1F2421', fontWeight: '700' }}>
              Shared Kitchen & Partner Sync
            </h4>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#6B7280', margin: '0 0 14px', lineHeight: '1.4' }}>
            Coordinate meals with your partner, spouse, or roommate. Both can view the same live pantry and weekly planner!
          </p>

          {/* Kitchen Invite Code */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            padding: '10px 14px',
            marginBottom: '14px'
          }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase' }}>
                Your Kitchen Invite Code
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', letterSpacing: '1.5px', color: '#1F2421', fontFamily: 'monospace' }}>
                {inviteCode}
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '8px',
                background: copied ? '#ECFDF5' : '#FAF5FF',
                border: `1px solid ${copied ? '#A7F3D0' : '#E9D5FF'}`,
                color: copied ? '#059669' : '#7E22CE',
                fontSize: '0.78rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Join Partner's Kitchen */}
          <form onSubmit={handleJoinHousehold} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Enter partner's 6-char code..."
              value={partnerCode}
              maxLength={6}
              onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '10px',
                border: '1.5px solid #E5E7EB',
                fontSize: '0.84rem',
                outline: 'none',
                textTransform: 'uppercase',
                fontFamily: 'monospace',
                fontWeight: '700'
              }}
            />
            <button
              type="submit"
              disabled={loadingJoin || !partnerCode.trim()}
              className="btn-primary"
              style={{
                padding: '9px 16px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: '700',
                whiteSpace: 'nowrap',
                opacity: !partnerCode.trim() ? 0.6 : 1
              }}
            >
              {loadingJoin ? 'Joining...' : 'Link Kitchen'}
            </button>
          </form>

          {joinStatus && (
            <div style={{
              fontSize: '0.78rem',
              marginTop: '8px',
              color: joinStatus.startsWith('✓') ? '#059669' : '#DC2626',
              fontWeight: '600'
            }}>
              {joinStatus}
            </div>
          )}
        </div>

        {/* Sign Out Button */}
        <button
          type="button"
          onClick={() => {
            onSignOut();
            onClose();
          }}
          style={{
            width: '100%',
            padding: '11px',
            borderRadius: '12px',
            border: '1.5px solid #FEE2E2',
            background: '#FEF2F2',
            color: '#DC2626',
            fontWeight: '700',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <IconLogOut size={16} color="#DC2626" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
