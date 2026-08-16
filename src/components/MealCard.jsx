import React from 'react';
import { IconClock, IconFlame, IconBook } from './Icons.jsx';

export default function MealCard({ recipe, onSelectRecipe }) {
  if (!recipe) return null;

  return (
    <div
      className="card card-hover animate-fade mb-4"
      style={{
        padding: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
        <img
          src={recipe.image}
          alt={recipe.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          padding: '4px 12px',
          borderRadius: '999px',
          fontSize: '0.75rem',
          fontWeight: '700',
          color: '#5C6460',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          {recipe.effortLevel || recipe.effort}
        </div>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
          {recipe.tags?.map((tag, idx) => {
            let badgeClass = 'badge-comfort';
            if (tag.includes('Protein')) badgeClass = 'badge-protein';
            if (tag.includes('Low Calorie')) badgeClass = 'badge-lowcal';
            if (tag.includes('Quick') || tag.includes('Easy')) badgeClass = 'badge-quick';

            return (
              <span
                key={idx}
                className={`chip ${badgeClass}`}
                style={{ fontSize: '0.72rem', padding: '3px 10px' }}
              >
                {tag}
              </span>
            );
          })}
        </div>

        <h3 style={{ fontSize: '1.1rem', color: '#1F2421', marginBottom: '6px', lineHeight: '1.3' }}>
          {recipe.title}
        </h3>

        <p style={{ fontSize: '0.85rem', color: '#5C6460', marginBottom: '14px', flex: 1, lineHeight: '1.45' }}>
          {recipe.description || 'A wholesome meal option curated for Suhanu.'}
        </p>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '12px',
          borderTop: '1px solid rgba(0,0,0,0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.78rem', color: '#5C6460' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <IconFlame size={14} color="#D97706" /> {recipe.calories} kcal
            </span>
            <span style={{ fontWeight: '600', color: '#60986A' }}>
              {recipe.protein} Protein
            </span>
          </div>

          <button
            onClick={() => onSelectRecipe(recipe)}
            className="btn-primary"
            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
          >
            <IconBook size={14} color="white" />
            <span>Recipe</span>
          </button>
        </div>
      </div>
    </div>
  );
}
