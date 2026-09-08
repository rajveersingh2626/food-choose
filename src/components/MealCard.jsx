import React, { useState } from 'react';
import { getFoodPhotoUrl } from '../services/geminiService.js';
import FoodImage from './FoodImage.jsx';
import { IconClock, IconFlame, IconBook, IconDumbbell, IconShoppingBag, IconCheckCircle } from './Icons.jsx';

export default function MealCard({ recipe, onSelectRecipe, pantryItems = [] }) {
  if (!recipe) return null;

  const imgSrc = getFoodPhotoUrl(recipe.title, recipe.photoSearchQuery);

  const prepTime = recipe.prepTime || '5 mins';
  const cookTime = recipe.cookTime || recipe.effort || '10 mins';

  // Compute pantry match if not already provided
  const pantryNames = pantryItems.filter(i => i.inStock).map(i => i.name.toLowerCase());
  const haveCount = (recipe.ingredientsHave || []).length;
  const needCount = (recipe.ingredientsNeed || []).length;
  const totalCount = haveCount + needCount;

  let matchPct = recipe.pantryMatchPct;
  if (matchPct === undefined) {
    if (totalCount > 0) {
      matchPct = Math.round((haveCount / totalCount) * 100);
    } else {
      matchPct = 90;
    }
  }

  const isFullMatch = matchPct >= 95 || needCount === 0;

  return (
    <div
      className="card card-hover animate-fade"
      style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
    >
      {/* Food Photo */}
      <div style={{ position: 'relative', height: '185px', overflow: 'hidden', background: '#F0EBF0' }}>
        <FoodImage
          src={imgSrc}
          alt={recipe.title}
          title={recipe.title}
          query={recipe.photoSearchQuery}
          height="185px"
        />
        <div className="photo-overlay" />

        {/* Pantry Match Badge */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: isFullMatch ? 'rgba(34, 197, 94, 0.92)' : 'rgba(245, 158, 11, 0.92)',
          backdropFilter: 'blur(4px)',
          color: 'white',
          fontSize: '0.72rem',
          fontWeight: '800',
          padding: '4px 9px',
          borderRadius: '999px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          {isFullMatch ? (
            <>
              <IconCheckCircle size={12} color="white" />
              <span>100% In Pantry</span>
            </>
          ) : (
            <span>{matchPct}% Match</span>
          )}
        </div>

        {/* Effort badge */}
        {(recipe.effortLevel || recipe.effort) && (
          <div className="photo-badge" style={{ left: '10px', top: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <IconClock size={11} color="white" />
            <span>{recipe.effortLevel || recipe.effort}</span>
          </div>
        )}

        {/* Nutrition pills pinned to bottom of photo */}
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '12px',
          display: 'flex',
          gap: '6px',
        }}>
          {recipe.calories && (
            <span style={{
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(6px)',
              color: 'white',
              fontSize: '0.72rem',
              fontWeight: '700',
              padding: '3px 8px',
              borderRadius: '999px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <IconFlame size={11} color="#FCD34D" /> {recipe.calories} kcal
            </span>
          )}
          {recipe.protein && (
            <span style={{
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(6px)',
              color: '#86EFAC',
              fontSize: '0.72rem',
              fontWeight: '700',
              padding: '3px 8px',
              borderRadius: '999px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <IconDumbbell size={11} color="#86EFAC" /> {recipe.protein}
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Tags */}
        {recipe.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {recipe.tags.slice(0, 3).map((tag, idx) => {
              let cls = 'badge-comfort';
              if (tag.includes('Protein')) cls = 'badge-protein';
              else if (tag.includes('Low Calorie') || tag.includes('No Cook')) cls = 'badge-lowcal';
              else if (tag.includes('Quick') || tag.includes('Easy') || tag.includes('Mins')) cls = 'badge-quick';
              else if (tag.includes('Fusion') || tag.includes('Global')) cls = 'badge-fusion';
              return (
                <span key={idx} className={`chip ${cls}`} style={{ fontSize: '0.7rem', padding: '2px 9px' }}>
                  {tag}
                </span>
              );
            })}
          </div>
        )}

        <h3 style={{
          fontSize: '1rem',
          color: '#1F2421',
          marginBottom: '6px',
          lineHeight: '1.3',
          fontWeight: '700'
        }}>
          {recipe.title}
        </h3>

        <p style={{ fontSize: '0.82rem', color: '#5C6460', marginBottom: '12px', flex: 1, lineHeight: '1.45' }}>
          {recipe.description || 'A wholesome meal crafted just for you.'}
        </p>

        {/* Prep + Cook Time Row */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <span className="time-pill prep" style={{ fontSize: '0.72rem', padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <IconClock size={11} /> Prep: {prepTime}
          </span>
          <span className="time-pill cook" style={{ fontSize: '0.72rem', padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <IconFlame size={11} /> Cook: {cookTime}
          </span>
        </div>

        {/* Missing ingredients preview */}
        {needCount > 0 && (
          <div style={{ fontSize: '0.73rem', color: '#D97706', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <IconShoppingBag size={13} color="#D97706" />
            <span>Needs: {recipe.ingredientsNeed.slice(0, 2).join(', ')}{needCount > 2 ? ` +${needCount - 2} more` : ''}</span>
          </div>
        )}

        {/* CTA Button */}
        <button
          onClick={() => onSelectRecipe(recipe)}
          className="btn-secondary"
          style={{ width: '100%', justifyContent: 'center', fontSize: '0.82rem', marginTop: 'auto', padding: '8px 12px' }}
        >
          <IconBook size={14} />
          <span>View Full Recipe & Steps</span>
        </button>
      </div>
    </div>
  );
}
