import React, { useState } from 'react';
import { IconClose, IconCheck, IconFlame, IconClock } from './Icons.jsx';

export default function RecipeModal({ recipe, onClose, pantryItems }) {
  if (!recipe) return null;

  const [completedSteps, setCompletedSteps] = useState({});

  const toggleStep = (idx) => {
    setCompletedSteps(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const pantryNames = pantryItems.filter(i => i.inStock).map(i => i.name.toLowerCase());

  const checkInPantry = (ingName) => {
    const clean = ingName.toLowerCase();
    return pantryNames.some(p => clean.includes(p) || p.includes(clean));
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.45)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      zIndex: 2000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '16px'
    }}>
      <div
        className="card animate-fade"
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          background: 'white',
          borderRadius: '24px',
          overflowY: 'auto',
          padding: 0,
          position: 'relative'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'white',
            border: 'none',
            cursor: 'pointer',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          <IconClose size={18} color="#1F2421" />
        </button>

        {/* Hero Image */}
        <div style={{ position: 'relative', height: '220px', width: '100%' }}>
          <img
            src={recipe.image}
            alt={recipe.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: '16px',
            background: 'rgba(255,255,255,0.95)',
            padding: '4px 12px',
            borderRadius: '999px',
            fontSize: '0.78rem',
            fontWeight: '700',
            color: 'var(--primary)'
          }}>
            Prep: {recipe.prepTime} | Cook: {recipe.cookTime}
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.35rem', color: '#1F2421', marginBottom: '8px', fontWeight: '700' }}>
            {recipe.title}
          </h2>

          <p style={{ fontSize: '0.88rem', color: '#5C6460', marginBottom: '16px', lineHeight: '1.45' }}>
            {recipe.description}
          </p>

          {/* Nutrition Table */}
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
            <div>
              <div style={{ fontSize: '0.7rem', color: '#949C98', fontWeight: '700' }}>CALORIES</div>
              <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1F2421' }}>{recipe.calories}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#949C98', fontWeight: '700' }}>PROTEIN</div>
              <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--accent-sage)' }}>{recipe.protein}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#949C98', fontWeight: '700' }}>CARBS</div>
              <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1F2421' }}>{recipe.carbs}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#949C98', fontWeight: '700' }}>FAT</div>
              <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1F2421' }}>{recipe.fat}</div>
            </div>
          </div>

          {/* Ingredients Section */}
          <div className="mb-4">
            <h3 style={{ fontSize: '1rem', color: '#1F2421', marginBottom: '10px', fontWeight: '700' }}>
              Ingredients Checklist
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {recipe.ingredientsHave?.map((ing, i) => {
                const inPantry = checkInPantry(ing);
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.85rem',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: inPantry ? 'var(--accent-sage-light)' : '#FAF7F8',
                      color: inPantry ? 'var(--accent-sage)' : '#1F2421'
                    }}
                  >
                    <span>{ing}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>
                      {inPantry ? 'In Suhanu\'s Pantry' : 'Pantry Item'}
                    </span>
                  </div>
                );
              })}
              {recipe.ingredientsNeed?.map((ing, i) => (
                <div
                  key={`need-${i}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                    fontSize: '0.85rem',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    background: '#FEF3C7',
                    color: '#D97706'
                  }}
                >
                  <span>{ing}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>Grocery Addition</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cooking Instructions */}
          <div className="mb-4">
            <h3 style={{ fontSize: '1rem', color: '#1F2421', marginBottom: '10px', fontWeight: '700' }}>
              Cooking Instructions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recipe.instructions?.map((step, idx) => {
                const isDone = completedSteps[idx];
                return (
                  <div
                    key={idx}
                    onClick={() => toggleStep(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1px solid rgba(0,0,0,0.08)',
                      background: isDone ? '#F4F4F6' : 'white',
                      cursor: 'pointer',
                      opacity: isDone ? 0.6 : 1
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!!isDone}
                      onChange={() => {}}
                      style={{ marginTop: '3px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                    />
                    <div style={{
                      fontSize: '0.88rem',
                      color: isDone ? '#949C98' : '#1F2421',
                      textDecoration: isDone ? 'line-through' : 'none',
                      lineHeight: '1.45'
                    }}>
                      <strong style={{ color: 'var(--primary)' }}>Step {idx + 1}:</strong> {step}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '12px' }}
          >
            Close Recipe
          </button>
        </div>
      </div>
    </div>
  );
}
