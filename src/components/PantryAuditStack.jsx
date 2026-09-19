import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { IconCheck, IconClose, IconRefresh, IconArrowLeft, IconClock } from './Icons.jsx';
import { supabaseService } from '../services/supabaseService.js';

function SwipeableCard({ item, onSwipeLeft, onSwipeRight, isTop }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-180, 180], [-14, 14]);
  const keepOpacity = useTransform(x, [20, 100], [0, 1]);
  const trashOpacity = useTransform(x, [-20, -100], [0, 1]);

  // Expiration calculation
  const now = new Date();
  const expiry = item.expires_at ? new Date(item.expires_at) : new Date();
  const diffHours = Math.round((expiry.getTime() - now.getTime()) / (1000 * 3600));
  const diffDays = Math.ceil(diffHours / 24);

  let urgencyColor = '#059669';
  let urgencyBg = '#ECFDF5';
  let urgencyText = `${diffDays} days left`;

  if (diffHours <= 0) {
    urgencyColor = '#DC2626';
    urgencyBg = '#FEF2F2';
    urgencyText = 'Expired today';
  } else if (diffDays === 1) {
    urgencyColor = '#D97706';
    urgencyBg = '#FFFBEB';
    urgencyText = 'Expires tomorrow';
  } else if (diffDays <= 3) {
    urgencyColor = '#D97706';
    urgencyBg = '#FFFBEB';
    urgencyText = `${diffDays} days left`;
  }

  const storageMethod = item.storage_method || 'fridge';
  const storageBadgeConfig = {
    fridge: { label: 'Fridge', bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
    freezer: { label: 'Freezer', bg: '#F0FDFA', color: '#0D9488', border: '#99F6E4' },
    counter: { label: 'Counter', bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' }
  }[storageMethod] || { label: 'Fridge', bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' };

  const handleDragEnd = (_e, info) => {
    if (info.offset.x > 110) {
      onSwipeRight(item);
    } else if (info.offset.x < -110) {
      onSwipeLeft(item);
    }
  };

  return (
    <motion.div
      style={{
        position: 'absolute',
        width: '100%',
        maxWidth: '360px',
        height: '420px',
        x,
        rotate: isTop ? rotate : 0,
        zIndex: isTop ? 10 : 1,
        cursor: isTop ? 'grab' : 'default'
      }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: 'grabbing' }}
      initial={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 12, opacity: isTop ? 1 : 0.7 }}
      animate={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 12, opacity: isTop ? 1 : 0.7 }}
      exit={{ x: x.get() < 0 ? -300 : 300, opacity: 0, scale: 0.85, transition: { duration: 0.25 } }}
    >
      <div style={{
        width: '100%',
        height: '100%',
        background: 'white',
        borderRadius: '24px',
        border: '1.5px solid #E5E7EB',
        boxShadow: isTop ? '0 18px 36px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none'
      }}>
        {/* Swipe Visual Feedback Stamps */}
        {isTop && (
          <>
            <motion.div
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: '2px solid #059669',
                color: '#059669',
                fontWeight: '800',
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                opacity: keepOpacity,
                transform: 'rotate(12deg)',
                background: 'rgba(236, 253, 245, 0.9)',
                pointerEvents: 'none',
                zIndex: 20
              }}
            >
              Still Good (+2d)
            </motion.div>

            <motion.div
              style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: '2px solid #DC2626',
                color: '#DC2626',
                fontWeight: '800',
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                opacity: trashOpacity,
                transform: 'rotate(-12deg)',
                background: 'rgba(254, 242, 242, 0.9)',
                pointerEvents: 'none',
                zIndex: 20
              }}
            >
              Trashed / Out
            </motion.div>
          </>
        )}

        {/* Card Header: Storage Method & Expiry Badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            fontSize: '0.74rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            padding: '4px 10px',
            borderRadius: '999px',
            background: storageBadgeConfig.bg,
            color: storageBadgeConfig.color,
            border: `1px solid ${storageBadgeConfig.border}`
          }}>
            {storageBadgeConfig.label}
          </span>

          <span style={{
            fontSize: '0.74rem',
            fontWeight: '700',
            padding: '4px 10px',
            borderRadius: '999px',
            background: urgencyBg,
            color: urgencyColor,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <IconClock size={12} color={urgencyColor} />
            {urgencyText}
          </span>
        </div>

        {/* Center: Item Identity Visual Block */}
        <div style={{ textAlign: 'center', margin: 'auto 0' }}>
          <div style={{
            width: '84px',
            height: '84px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)',
            border: '1.5px solid #E9D5FF',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            boxShadow: '0 8px 16px rgba(126, 34, 206, 0.08)'
          }}>
            <span style={{ fontSize: '2rem', fontWeight: '800', color: '#7E22CE', fontFamily: 'Outfit, sans-serif' }}>
              {(item.item_name || item.name || 'F')[0].toUpperCase()}
            </span>
          </div>

          <h3 style={{
            fontSize: '1.4rem',
            fontWeight: '800',
            color: '#1F2421',
            margin: '0 0 6px',
            lineHeight: '1.25'
          }}>
            {item.item_name || item.name}
          </h3>

          {item.brand && (
            <div style={{ fontSize: '0.82rem', fontWeight: '600', color: '#7E22CE', marginBottom: '4px' }}>
              {item.brand}
            </div>
          )}

          <div style={{ fontSize: '0.85rem', color: '#6B7280', fontWeight: '500' }}>
            Quantity: <strong style={{ color: '#1F2421' }}>{item.quantity} {item.unit || ''}</strong>
          </div>

          {item.audit_extension_count > 0 && (
            <div style={{
              display: 'inline-block',
              marginTop: '8px',
              fontSize: '0.72rem',
              fontWeight: '600',
              color: '#059669',
              background: '#ECFDF5',
              padding: '2px 8px',
              borderRadius: '6px'
            }}>
              Confirmed fresh {item.audit_extension_count} {item.audit_extension_count === 1 ? 'time' : 'times'}
            </div>
          )}
        </div>

        {/* Footer Swipe Instruction Prompt */}
        <div style={{
          borderTop: '1px solid #F3F4F6',
          paddingTop: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: '#9CA3AF',
          fontWeight: '600'
        }}>
          <span>&larr; Swipe left to Trash</span>
          <span>Swipe right to Keep &rarr;</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function PantryAuditStack({ householdId, onFinished, onPantryUpdated }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [auditHistory, setAuditHistory] = useState({ kept: 0, trashed: 0 });

  useEffect(() => {
    loadAuditQueue();
  }, [householdId]);

  const loadAuditQueue = async () => {
    setLoading(true);
    try {
      if (!householdId) {
        // Fallback demo queue from local storage if not logged in
        const saved = localStorage.getItem('suhanu_pantry_items_v4');
        const parsed = saved ? JSON.parse(saved) : [];
        const now = Date.now();
        const demoQueue = parsed.slice(0, 8).map((it, idx) => ({
          id: it.id || `demo-${idx}`,
          item_name: it.name,
          quantity: it.quantity || '1 pack',
          storage_method: idx % 3 === 0 ? 'counter' : idx % 2 === 0 ? 'fridge' : 'freezer',
          expires_at: new Date(now + (idx - 1) * 36 * 3600 * 1000).toISOString(),
          audit_extension_count: 0
        }));
        setItems(demoQueue);
      } else {
        const queue = await supabaseService.fetchAuditQueue(householdId);
        setItems(queue);
      }
    } catch (err) {
      console.warn('Could not load audit queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipeRight = async (item) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    setAuditHistory((prev) => ({ ...prev, kept: prev.kept + 1 }));

    try {
      if (householdId) {
        await supabaseService.extendItemFreshness(item.id, 2);
      }
      if (onPantryUpdated) onPantryUpdated();
    } catch (err) {
      console.error('Failed to extend item freshness:', err);
    }
  };

  const handleSwipeLeft = async (item) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    setAuditHistory((prev) => ({ ...prev, trashed: prev.trashed + 1 }));

    try {
      if (householdId) {
        await supabaseService.auditSoftDeleteItem(item.id);
      }
      if (onPantryUpdated) onPantryUpdated();
    } catch (err) {
      console.error('Failed to audit soft-delete item:', err);
    }
  };

  const currentItem = items[0];

  return (
    <div style={{
      maxWidth: '420px',
      margin: '0 auto',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '520px'
    }}>
      {/* Top Header */}
      <div style={{ width: '100%', marginBottom: '20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1F2421', margin: '0 0 4px' }}>
          Pantry Freshness Audit
        </h2>
        <p style={{ fontSize: '0.82rem', color: '#6B7280', margin: 0 }}>
          Swipe right if it is still good. Swipe left if you ran out.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: '#6B7280', fontSize: '0.88rem' }}>
          Scanning active kitchen inventory...
        </div>
      ) : items.length === 0 ? (
        /* Empty / Celebratory State */
        <div className="card animate-fade" style={{
          width: '100%',
          maxWidth: '360px',
          background: 'white',
          borderRadius: '24px',
          padding: '36px 24px',
          textAlign: 'center',
          border: '1.5px solid #E5E7EB',
          boxShadow: '0 12px 28px rgba(0,0,0,0.06)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: '#ECFDF5',
            color: '#059669',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <IconCheck size={32} />
          </div>

          <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#1F2421', margin: '0 0 6px' }}>
            Kitchen Audit Complete
          </h3>
          <p style={{ fontSize: '0.84rem', color: '#6B7280', lineHeight: '1.45', margin: '0 0 20px' }}>
            All expiring items have been reviewed. Your pantry and meal suggestions are fully synchronized.
          </p>

          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            background: '#F9FAFB',
            borderRadius: '14px',
            padding: '12px',
            marginBottom: '20px'
          }}>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#059669' }}>{auditHistory.kept}</div>
              <div style={{ fontSize: '0.74rem', color: '#6B7280', fontWeight: '600' }}>Kept Fresh</div>
            </div>
            <div style={{ width: '1px', background: '#E5E7EB' }} />
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#DC2626' }}>{auditHistory.trashed}</div>
              <div style={{ fontSize: '0.74rem', color: '#6B7280', fontWeight: '600' }}>Cleared Out</div>
            </div>
          </div>

          <button
            type="button"
            onClick={onFinished}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
          >
            Back to Pantry
          </button>
        </div>
      ) : (
        <>
          {/* Card Stack Container */}
          <div style={{
            position: 'relative',
            width: '100%',
            height: '430px',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <AnimatePresence>
              {items.slice(0, 2).reverse().map((item, idx, arr) => {
                const isTop = idx === arr.length - 1;
                return (
                  <SwipeableCard
                    key={item.id}
                    item={item}
                    isTop={isTop}
                    onSwipeLeft={handleSwipeLeft}
                    onSwipeRight={handleSwipeRight}
                  />
                );
              })}
            </AnimatePresence>
          </div>

          {/* Accessible Control Action Buttons for Desktop / Clicks */}
          {currentItem && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '24px',
              marginTop: '16px'
            }}>
              <button
                type="button"
                onClick={() => handleSwipeLeft(currentItem)}
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  border: '2px solid #FCA5A5',
                  background: '#FEF2F2',
                  color: '#DC2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 6px 14px rgba(220, 38, 38, 0.12)',
                  transition: 'all 0.15s ease'
                }}
                title="Trashed or Ran out"
              >
                <IconClose size={22} color="#DC2626" />
              </button>

              <button
                type="button"
                onClick={loadAuditQueue}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: '1.5px solid #E5E7EB',
                  background: 'white',
                  color: '#6B7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                }}
                title="Reload audit queue"
              >
                <IconRefresh size={16} color="#6B7280" />
              </button>

              <button
                type="button"
                onClick={() => handleSwipeRight(currentItem)}
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  border: '2px solid #86EFAC',
                  background: '#ECFDF5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 6px 14px rgba(5, 150, 105, 0.12)',
                  transition: 'all 0.15s ease'
                }}
                title="Still good / Keep (+2 days)"
              >
                <IconCheck size={24} color="#059669" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
