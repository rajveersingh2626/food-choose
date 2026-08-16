import React, { useState } from 'react';
import { askGeminiChef } from '../services/geminiService.js';
import MealCard from './MealCard.jsx';
import { IconSparkles, IconClock, IconFlame } from './Icons.jsx';

export default function MoodChat({ pantryItems, apiKey, onSelectRecipe }) {
  const [mood, setMood] = useState('tired');
  const [effort, setEffort] = useState('5min');
  const [craving, setCraving] = useState('protein');
  const [customInput, setCustomInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchRecommendations = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await askGeminiChef({
        apiKey,
        mood,
        effort,
        craving,
        customPrompt: customInput,
        pantryItems
      });
      setAiResult(res);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to fetch recommendations from Gemini AI.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    fetchRecommendations();
  };

  return (
    <div className="animate-fade">
      {/* Selection Banner */}
      <div className="card mb-4" style={{ background: 'linear-gradient(135deg, #FAF7F8 0%, #FDE8ED 50%, #E4F1E7 100%)' }}>
        <h2 style={{ fontSize: '1.25rem', color: '#1F2421', marginBottom: '4px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconSparkles size={20} color="var(--primary)" />
          <span>What to Eat Right Now</span>
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#5C6460', marginBottom: '16px' }}>
          Select your current mood & effort tolerance below, then click <strong>Get AI Recommendations</strong>!
        </p>

        {/* Question 1: Energy & Mood */}
        <div className="mb-4">
          <label style={{ fontSize: '0.82rem', fontWeight: '700', color: '#1F2421', display: 'block', marginBottom: '8px' }}>
            1. Current Energy & Mood:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
            {[
              { id: 'tired', label: 'Tired / Exhausted' },
              { id: 'energetic', label: 'Energetic & Ready' },
              { id: 'cozy', label: 'Cozy & Relaxed' },
              { id: 'stressed', label: 'Needs Comfort Food' }
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setMood(item.id)}
                className={`chip ${mood === item.id ? 'chip-active' : 'chip-inactive'}`}
                style={{ padding: '10px 12px', textAlign: 'center', borderRadius: '12px' }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Question 2: Effort Limit */}
        <div className="mb-4">
          <label style={{ fontSize: '0.82rem', fontWeight: '700', color: '#1F2421', display: 'block', marginBottom: '8px' }}>
            2. Cooking Effort Limit (Strict Time Accounting):
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
            {[
              { id: '5min', label: '0-5 Mins (Lowest Effort)' },
              { id: '15min', label: '15 Mins (Quick Prep)' },
              { id: '30min', label: '30 Mins (Cozy Cooking)' }
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setEffort(item.id)}
                className={`chip ${effort === item.id ? 'chip-active' : 'chip-inactive'}`}
                style={{ padding: '10px 12px', textAlign: 'center', borderRadius: '12px' }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Question 3: Nutrition Focus */}
        <div className="mb-4">
          <label style={{ fontSize: '0.82rem', fontWeight: '700', color: '#1F2421', display: 'block', marginBottom: '8px' }}>
            3. Nutrition Focus:
          </label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'protein', label: 'High Protein' },
              { id: 'lowcal', label: 'Low Calorie' },
              { id: 'comfort', label: 'Warm Comfort' },
              { id: 'sweet', label: 'Sweet Snack' }
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCraving(item.id)}
                className={`chip ${craving === item.id ? 'chip-active' : 'chip-inactive'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form Input & Action Button */}
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
          <input
            type="text"
            placeholder="Custom wish (e.g. 'I want something cheesy in 5 mins')..."
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            style={{ background: 'white', width: '100%' }}
          />

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.92rem' }}
          >
            <IconSparkles size={18} />
            <span>{loading ? 'Asking Gemini AI Chef...' : 'Get AI Recommendations'}</span>
          </button>
        </form>
      </div>

      {/* Error Message if API fails */}
      {errorMsg && (
        <div className="card mb-4" style={{ background: '#FEF2F2', borderColor: '#FCA5A5', color: '#991B1B', fontSize: '0.88rem' }}>
          <strong>AI Error:</strong> {errorMsg}
        </div>
      )}

      {/* Output Results */}
      {!loading && !aiResult && !errorMsg && (
        <div className="card text-center" style={{ textAlign: 'center', padding: '36px 20px' }}>
          <div style={{ color: 'var(--primary)', marginBottom: '10px', display: 'flex', justifyContent: 'center' }}>
            <IconSparkles size={36} />
          </div>
          <h3 style={{ fontSize: '1.05rem', color: '#1F2421', marginBottom: '6px' }}>
            Ready to find your ideal meal?
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#5C6460' }}>
            Select your preferences above and click <strong>Get AI Recommendations</strong> to trigger the Gemini LLM!
          </p>
        </div>
      )}

      {loading && (
        <div className="card text-center" style={{ textAlign: 'center', padding: '36px' }}>
          <p style={{ fontSize: '0.92rem', color: '#1F2421' }}>Gemini LLM is crafting customized, low-effort recommendations for Suhanu...</p>
        </div>
      )}

      {aiResult && !loading && (
        <>
          <div className="card mb-4" style={{ borderLeft: '4px solid var(--primary)' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--primary)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
              Gemini AI Chef Response
            </div>
            <p style={{ fontSize: '0.95rem', color: '#1F2421', lineHeight: '1.5', marginBottom: '8px' }}>
              {aiResult.aiGreeting}
            </p>
            {aiResult.chefTip && (
              <div style={{ fontSize: '0.82rem', color: 'var(--accent-sage)', background: 'var(--accent-sage-light)', padding: '8px 12px', borderRadius: '8px', fontWeight: '500' }}>
                Chef Tip: {aiResult.chefTip}
              </div>
            )}
          </div>

          <h3 style={{ fontSize: '1.1rem', color: '#1F2421', marginBottom: '14px', fontWeight: '700' }}>
            Recommended AI Dishes:
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {aiResult.recommendations?.map((recipe, idx) => (
              <MealCard
                key={recipe.id || idx}
                recipe={recipe}
                onSelectRecipe={onSelectRecipe}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
