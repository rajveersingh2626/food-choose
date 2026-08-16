import React, { useState, useEffect } from 'react';
import MealCard from './MealCard.jsx';
import { fetchLlmRecipes } from '../services/geminiService.js';
import { SAMPLE_RECIPES } from '../data/sampleRecipes.js';
import { IconSparkles, IconBook, IconPantry } from './Icons.jsx';

export default function RecipeLibrary({ pantryItems, apiKey, onSelectRecipe }) {
  const [activeSubTab, setActiveSubTab] = useState('pantry'); // 'pantry' vs 'global'
  const [pantryRecipes, setPantryRecipes] = useState(SAMPLE_RECIPES.slice(0, 4));
  const [globalRecipes, setGlobalRecipes] = useState(SAMPLE_RECIPES.slice(4));
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadLlmRecipes = async (mode) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const newDishes = await fetchLlmRecipes({ apiKey, mode, pantryItems });
      if (mode === 'pantry') {
        setPantryRecipes(prev => [...newDishes, ...prev]);
      } else {
        setGlobalRecipes(prev => [...newDishes, ...prev]);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to generate recipes from Gemini LLM.');
    } finally {
      setLoading(false);
    }
  };

  const currentList = activeSubTab === 'pantry' ? pantryRecipes : globalRecipes;

  return (
    <div className="animate-fade">
      {/* Top Banner */}
      <div className="card mb-4" style={{ background: 'linear-gradient(135deg, #FAF7F8 0%, #F3E8FF 100%)' }}>
        <h2 style={{ fontSize: '1.25rem', color: '#1F2421', marginBottom: '4px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconBook size={20} color="var(--primary)" />
          <span>AI Recipe Library</span>
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#5C6460', marginBottom: '14px' }}>
          Switch between recipes matching Suhanu's checked pantry vs creative global fusion dishes!
        </p>

        {/* 2 Filter Sub-Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
          <button
            onClick={() => setActiveSubTab('pantry')}
            className={`chip ${activeSubTab === 'pantry' ? 'chip-active' : 'chip-inactive'}`}
            style={{ padding: '10px', borderRadius: '12px', textAlign: 'center', fontSize: '0.85rem' }}
          >
            Pantry Match Recipes ({pantryItems.filter(i => i.inStock).length} Checked)
          </button>

          <button
            onClick={() => setActiveSubTab('global')}
            className={`chip ${activeSubTab === 'global' ? 'chip-active' : 'chip-inactive'}`}
            style={{ padding: '10px', borderRadius: '12px', textAlign: 'center', fontSize: '0.85rem' }}
          >
            Global & Unconventional
          </button>
        </div>

        {/* Generate More via Gemini AI button */}
        <button
          onClick={() => loadLlmRecipes(activeSubTab)}
          disabled={loading}
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
        >
          <IconSparkles size={18} />
          <span>{loading ? 'Crafting New Recipes via Gemini LLM...' : `Generate More ${activeSubTab === 'pantry' ? 'Pantry-Matched' : 'Global Fusion'} AI Recipes`}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="card mb-4" style={{ background: '#FEF2F2', borderColor: '#FCA5A5', color: '#991B1B', fontSize: '0.88rem' }}>
          <strong>Error:</strong> {errorMsg}
        </div>
      )}

      {/* Recipes Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {currentList.map((recipe, idx) => (
          <MealCard
            key={recipe.id || idx}
            recipe={recipe}
            onSelectRecipe={onSelectRecipe}
          />
        ))}
      </div>
    </div>
  );
}
