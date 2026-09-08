import React, { useState, useEffect } from 'react';
import { getFoodPhotoUrl } from '../services/geminiService.js';
import FoodImage from './FoodImage.jsx';
import {
  IconClose,
  IconClock,
  IconFlame,
  IconCheck,
  IconCopy,
  IconSparkles,
  IconUtensils,
  IconShoppingBag,
  IconCheckCircle,
  IconDumbbell,
  IconArrowLeft
} from './Icons.jsx';

export default function RecipeModal({ recipe, onClose, pantryItems = [] }) {
  if (!recipe) return null;

  const [completedSteps, setCompletedSteps] = useState({});
  const [checkedIngredients, setCheckedIngredients] = useState({});
  const [copyToast, setCopyToast] = useState(false);

  // Lock background scroll while modal is active & listen to Escape key
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const toggleStep = (idx) => {
    setCompletedSteps(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleIngredient = (idx) => {
    setCheckedIngredients(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const doneCount = Object.values(completedSteps).filter(Boolean).length;
  const totalSteps = recipe.instructions?.length || 0;
  const progressPct = totalSteps > 0 ? Math.round((doneCount / totalSteps) * 100) : 0;

  const prepTime = recipe.prepTime || '5 mins';
  const cookTime = recipe.cookTime || recipe.effort || '10 mins';
  const totalTime = recipe.prepTime && recipe.cookTime
    ? `${parseInt(recipe.prepTime) + parseInt(recipe.cookTime)} mins`
    : (recipe.effort || '15 mins');

  // Ingredients split
  const haveList = recipe.ingredientsHave || [];
  const needList = recipe.ingredientsNeed || [];

  const handleCopyMissing = () => {
    if (needList.length === 0) return;
    const text = `Grocery items needed for ${recipe.title}:\n` + needList.map(item => `- ${item}`).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2500);
    });
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 10, 20, 0.6)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 2000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        padding: '16px',
        paddingBottom: 0
      }}
    >
      <div
        className="animate-fade"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '94vh',
          background: 'white',
          borderRadius: '28px 28px 0 0',
          overflowY: 'auto',
          position: 'relative',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.25)',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {/* Sticky Mobile/Tablet Navigation Bar */}
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          borderRadius: '28px 28px 0 0'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '999px',
              background: '#F4F4F6',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: '700',
              color: '#1F2421',
              transition: 'background 0.15s ease'
            }}
          >
            <IconArrowLeft size={15} />
            <span>Back</span>
          </button>

          <span style={{
            fontSize: '0.84rem',
            fontWeight: '800',
            color: '#1F2421',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '220px',
            padding: '0 8px'
          }}>
            {recipe.title}
          </span>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: '#F4F4F6',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease'
            }}
            aria-label="Close"
          >
            <IconClose size={16} color="#1F2421" />
          </button>
        </div>

        {/* Hero Image */}
        <div className="modal-hero" style={{ height: '240px', position: 'relative', overflow: 'hidden' }}>
          <FoodImage
            src={getFoodPhotoUrl(recipe.title, recipe.photoSearchQuery)}
            alt={recipe.title}
            title={recipe.title}
            query={recipe.photoSearchQuery}
            height="240px"
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.8) 100%)'
          }} />

          {/* Title overlay on photo */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '20px 24px 20px',
          }}>
            {/* Tags row */}
            {recipe.tags?.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {recipe.tags.slice(0, 3).map((tag, i) => (
                  <span key={i} style={{
                    background: 'rgba(255,255,255,0.24)',
                    backdropFilter: 'blur(4px)',
                    color: 'white',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    border: '1px solid rgba(255,255,255,0.35)'
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <h2 style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '1.45rem',
              fontWeight: '800',
              color: 'white',
              margin: 0,
              lineHeight: '1.25',
              textShadow: '0 2px 10px rgba(0,0,0,0.45)'
            }}>
              {recipe.title}
            </h2>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '22px 24px' }}>
          {/* Time pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <span className="time-pill prep" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <IconClock size={12} /> Prep: {prepTime}
            </span>
            <span className="time-pill cook" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <IconFlame size={12} /> Cook: {cookTime}
            </span>
            {totalTime && totalTime !== '—' && (
              <span className="time-pill total" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <IconClock size={12} /> Total: {totalTime}
              </span>
            )}
          </div>

          {/* Description */}
          <p style={{ fontSize: '0.9rem', color: '#4B5563', marginBottom: '18px', lineHeight: '1.6' }}>
            {recipe.description}
          </p>

          {/* Nutrition Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            background: '#FAF7F8',
            padding: '14px',
            borderRadius: '16px',
            textAlign: 'center',
            marginBottom: '20px',
            border: '1px solid var(--primary-border)'
          }}>
            {[
              { label: 'CALORIES', value: recipe.calories ? `${recipe.calories} kcal` : null, color: '#E7829A' },
              { label: 'PROTEIN', value: recipe.protein, color: '#059669' },
              { label: 'CARBS', value: recipe.carbs, color: '#D97706' },
              { label: 'FAT', value: recipe.fat, color: '#8B5CF6' }
            ].map(({ label, value, color }) => value && (
              <div key={label}>
                <div style={{ fontSize: '0.65rem', color: '#949C98', fontWeight: '700', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontSize: '0.95rem', fontWeight: '800', color }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Equipment Needed */}
          {recipe.equipment?.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: '800', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <IconUtensils size={14} color="#6B7280" />
                <span>Cookware & Tools Needed</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {recipe.equipment.map((tool, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: '#F3F4F6',
                      border: '1px solid #E5E7EB',
                      color: '#374151',
                      padding: '4px 12px',
                      borderRadius: '999px',
                      fontSize: '0.78rem',
                      fontWeight: '600'
                    }}
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Chef's Secret / Science Tip */}
          {recipe.chefSecret && (
            <div style={{
              background: 'linear-gradient(135deg, #FFF9FA 0%, #FEF3C7 100%)',
              border: '1.5px solid #FCD34D',
              borderRadius: '16px',
              padding: '14px 16px',
              marginBottom: '22px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <IconSparkles size={16} color="#D97706" />
                <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Chef's Secret / Flavor Science
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.86rem', color: '#78350F', lineHeight: '1.5', fontWeight: '500' }}>
                {recipe.chefSecret}
              </p>
            </div>
          )}

          {/* INGREDIENTS BREAKDOWN: PANTRY VS NEED TO BUY */}
          <div className="mb-4">
            <h3 style={{ fontSize: '1rem', color: '#1F2421', marginBottom: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconUtensils size={18} color="var(--primary)" />
              <span>Exact Ingredients & Prep Breakdown</span>
            </h3>

            {/* In Pantry Section */}
            {haveList.length > 0 && (
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: '700', color: '#059669', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <IconCheckCircle size={13} color="#059669" />
                  <span>Available In Pantry ({haveList.length})</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {haveList.map((ing, i) => {
                    const isChecked = checkedIngredients[`have-${i}`];
                    return (
                      <div
                        key={i}
                        onClick={() => toggleIngredient(`have-${i}`)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.86rem',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          background: isChecked ? '#F0FDF4' : '#ECFDF5',
                          color: '#065F46',
                          border: `1.5px solid ${isChecked ? '#34D399' : '#A7F3D0'}`,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '4px',
                            border: '1.5px solid #059669',
                            background: isChecked ? '#059669' : 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {isChecked && <IconCheck size={12} color="white" />}
                          </div>
                          <span style={{ fontWeight: '600', textDecoration: isChecked ? 'line-through' : 'none' }}>
                            {ing}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#059669' }}>
                          In stock
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Need to Buy Section */}
            {needList.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: '700', color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <IconShoppingBag size={13} color="#D97706" />
                    <span>To Buy / Pick Up ({needList.length})</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyMissing}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#D97706',
                      cursor: 'pointer',
                      fontSize: '0.74rem',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <IconCopy size={13} />
                    <span>{copyToast ? 'Copied!' : 'Copy to Grocery List'}</span>
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {needList.map((ing, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.86rem',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      background: '#FFFBEB',
                      color: '#92400E',
                      border: '1.5px solid #FCD34D'
                    }}>
                      <span style={{ fontWeight: '600' }}>+ {ing}</span>
                      <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#D97706' }}>Not in pantry</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {haveList.length === 0 && needList.length === 0 && (
              <p style={{ fontSize: '0.84rem', color: '#9CA3AF' }}>Refer to recipe steps below for exact ingredients.</p>
            )}
          </div>

          {/* Instructions with Interactive Checklist */}
          {recipe.instructions?.length > 0 && (
            <div style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '1rem', color: '#1F2421', margin: 0, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IconFlame size={18} color="var(--primary)" />
                  <span>Culinary Technique & Step-by-Step</span>
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: '700' }}>
                  {doneCount}/{totalSteps} Done ({progressPct}%)
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ height: '6px', background: '#F0EBF0', borderRadius: '999px', marginBottom: '16px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${progressPct}%`,
                  background: 'linear-gradient(90deg, #E7829A, #059669)',
                  borderRadius: '999px',
                  transition: 'width 0.3s ease'
                }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {recipe.instructions.map((step, idx) => {
                  const isDone = completedSteps[idx];
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleStep(idx)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '14px 16px',
                        borderRadius: '14px',
                        background: isDone ? '#F4FBF6' : '#FAF7F8',
                        border: `1.5px solid ${isDone ? '#86EFAC' : 'rgba(0,0,0,0.06)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: `2px solid ${isDone ? '#059669' : '#CBD5E1'}`,
                        background: isDone ? '#059669' : 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '1px'
                      }}>
                        {isDone && <IconCheck size={14} color="white" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '0.74rem', fontWeight: '800', color: isDone ? '#059669' : '#9CA3AF', display: 'block', marginBottom: '3px' }}>
                          STEP {idx + 1}
                        </span>
                        <p style={{
                          margin: 0,
                          fontSize: '0.88rem',
                          color: isDone ? '#6B7280' : '#1F2421',
                          lineHeight: '1.5',
                          textDecoration: isDone ? 'line-through' : 'none'
                        }}>
                          {step}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pairing Recommendation */}
          {recipe.pairing && (
            <div style={{
              background: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '14px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <IconSparkles size={16} color="#4B5563" />
              <div style={{ fontSize: '0.82rem', color: '#4B5563' }}>
                <strong style={{ color: '#1F2421' }}>Suggested Pairing:</strong> {recipe.pairing}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
