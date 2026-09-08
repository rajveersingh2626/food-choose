import React, { useState, useEffect, useRef, useCallback } from 'react';
import { askGeminiChef } from '../services/geminiService.js';
import MealCard from './MealCard.jsx';
import {
  IconSparkles,
  IconBatteryLow,
  IconBolt,
  IconSmile,
  IconHeartPulse,
  IconDumbbell,
  IconLeaf,
  IconUtensils,
  IconCoffee,
  IconClock
} from './Icons.jsx';

const MOOD_OPTIONS = [
  { id: 'tired',    icon: (cls) => <IconBatteryLow size={18} color={cls ? 'var(--primary)' : '#6B7280'} />, label: 'Tired & Drained' },
  { id: 'energetic',icon: (cls) => <IconBolt size={18} color={cls ? '#D97706' : '#6B7280'} />, label: 'Energetic & Ready' },
  { id: 'cozy',     icon: (cls) => <IconSmile size={18} color={cls ? '#8B5CF6' : '#6B7280'} />, label: 'Cozy & Relaxed' },
  { id: 'stressed', icon: (cls) => <IconHeartPulse size={18} color={cls ? '#EF4444' : '#6B7280'} />, label: 'Stressed — Need Comfort' }
];

const EFFORT_OPTIONS = [
  { id: '5min',  label: '0–5 Mins', sub: 'Practically no effort' },
  { id: '15min', label: '15 Mins',  sub: 'Quick & easy' },
  { id: '30min', label: '30 Mins',  sub: 'Cozy cooking' }
];

const CRAVING_OPTIONS = [
  { id: 'protein', icon: <IconDumbbell size={14} color="#059669" />, label: 'High Protein' },
  { id: 'lowcal',  icon: <IconLeaf size={14} color="#10B981" />,     label: 'Low Calorie' },
  { id: 'comfort', icon: <IconUtensils size={14} color="#D97706" />, label: 'Warm Comfort' },
  { id: 'sweet',   icon: <IconCoffee size={14} color="#8B5CF6" />,   label: 'Sweet Treat' }
];

const LOADING_MESSAGES = [
  'Checking active pantry ingredients...',
  'Gemini AI is crafting custom recipes for your mood...',
  'Fine-tuning real cooking times & flavor balance...',
  'Plating dishes and picking presentation photos...'
];

export default function MoodChat({ pantryItems, apiKey, onSelectRecipe }) {
  const [mood, setMood] = useState('tired');
  const [effort, setEffort] = useState('5min');
  const [craving, setCraving] = useState('protein');
  const [customInput, setCustomInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [aiResult, setAiResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [seenTitles, setSeenTitles] = useState(() => new Set());
  const [hasMore, setHasMore] = useState(true);

  const observerRef = useRef(null);
  const sentinelRef = useRef(null);
  const loadingMoreRef = useRef(false);

  const fetchRecommendations = async () => {
    setLoading(true);
    setErrorMsg('');
    setAiResult(null);
    setLoadingStep(0);
    setHasMore(true);

    const timer = setInterval(() => {
      setLoadingStep(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 1200);

    try {
      const res = await askGeminiChef({
        apiKey,
        mood,
        effort,
        craving,
        customPrompt: customInput,
        pantryItems,
        excludeTitles: []
      });

      if (res?.recommendations?.length > 0) {
        const initialTitles = new Set(res.recommendations.map(r => r.title.toLowerCase().trim()));
        setSeenTitles(initialTitles);
        setAiResult(res);
      } else {
        setAiResult(res);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to fetch recommendations. Check your API key or try again.');
    } finally {
      clearInterval(timer);
      setLoading(false);
    }
  };

  const handleLoadMore = useCallback(async () => {
    if (!aiResult?.recommendations || loadingMoreRef.current || !hasMore) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);

    try {
      const currentList = aiResult.recommendations;
      const currentTitles = currentList.map(r => r.title);

      const res = await askGeminiChef({
        apiKey,
        mood,
        effort,
        craving,
        customPrompt: customInput,
        pantryItems,
        excludeTitles: currentTitles
      });

      if (res?.recommendations?.length > 0) {
        // Strict deduplication against seen titles
        const newUniques = [];
        const updatedSeen = new Set(seenTitles);

        for (const item of res.recommendations) {
          const normTitle = item.title.toLowerCase().trim();
          if (!updatedSeen.has(normTitle)) {
            updatedSeen.add(normTitle);
            newUniques.push(item);
          }
        }

        if (newUniques.length > 0) {
          setSeenTitles(updatedSeen);
          setAiResult(prev => ({
            ...prev,
            recommendations: [...prev.recommendations, ...newUniques]
          }));
        } else {
          // If no new unique items returned, still allow another scroll later or limit
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (e) {
      console.error('Error loading more dishes:', e);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [aiResult, apiKey, mood, effort, craving, customInput, pantryItems, seenTitles, hasMore]);

  // Infinite Scroll IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current || !aiResult || loading) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loadingMoreRef.current && hasMore) {
        handleLoadMore();
      }
    }, { rootMargin: '300px' });

    observerRef.current.observe(sentinelRef.current);

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [aiResult, loading, handleLoadMore, hasMore]);

  return (
    <div className="animate-fade">
      {/* Selector Card */}
      <div className="card mb-4" style={{ background: 'linear-gradient(135deg, #FAF7F8 0%, #FDE8ED 50%, #E4F1E7 100%)' }}>
        <h2 style={{ fontSize: '1.2rem', color: '#1F2421', marginBottom: '4px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconSparkles size={20} color="var(--primary)" />
          <span>What Should I Eat Right Now?</span>
        </h2>
        <p style={{ fontSize: '0.84rem', color: '#5C6460', marginBottom: '18px' }}>
          Tell me how you're feeling and Gemini AI will curate the perfect meals tailored to your active pantry.
        </p>

        {/* Mood */}
        <div className="mb-4">
          <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#1F2421', display: 'block', marginBottom: '8px' }}>
            How are you feeling right now?
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {MOOD_OPTIONS.map(item => {
              const isSelected = mood === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMood(item.id)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '14px',
                    border: `2px solid ${isSelected ? 'var(--primary)' : 'rgba(0,0,0,0.08)'}`,
                    background: isSelected ? 'var(--primary-light)' : 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontFamily: 'inherit'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: isSelected ? 'white' : '#F9FAFB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {item.icon(isSelected)}
                  </div>
                  <span style={{
                    fontSize: '0.84rem',
                    fontWeight: isSelected ? '700' : '500',
                    color: isSelected ? 'var(--primary)' : '#374151'
                  }}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Effort */}
        <div className="mb-4">
          <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#1F2421', display: 'block', marginBottom: '8px' }}>
            How much time do you have?
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {EFFORT_OPTIONS.map(item => {
              const isSelected = effort === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setEffort(item.id)}
                  style={{
                    padding: '12px 10px',
                    borderRadius: '14px',
                    border: `2px solid ${isSelected ? '#8B5CF6' : 'rgba(0,0,0,0.08)'}`,
                    background: isSelected ? '#F3E8FF' : 'white',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s ease',
                    fontFamily: 'inherit'
                  }}
                >
                  <div style={{
                    fontSize: '0.88rem',
                    fontWeight: '700',
                    color: isSelected ? '#7C3AED' : '#1F2421',
                    marginBottom: '2px'
                  }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#9CA3AF', fontWeight: '500' }}>{item.sub}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Craving */}
        <div className="mb-4">
          <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#1F2421', display: 'block', marginBottom: '8px' }}>
            What are you craving?
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {CRAVING_OPTIONS.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCraving(item.id)}
                className={`chip ${craving === item.id ? 'chip-active' : 'chip-inactive'}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom wish */}
        <div className="mb-4">
          <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#1F2421', display: 'block', marginBottom: '6px' }}>
            Anything specific? (optional)
          </label>
          <input
            type="text"
            placeholder="e.g. 'something cheesy', 'I want pasta vibes', 'make it spicy'..."
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !loading && fetchRecommendations()}
            style={{ background: 'white', width: '100%' }}
          />
        </div>

        <button
          onClick={fetchRecommendations}
          disabled={loading}
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '0.95rem' }}
        >
          <IconSparkles size={18} />
          <span>{loading ? 'Asking Gemini AI Chef...' : 'Ask Gemini Chef'}</span>
        </button>
      </div>

      {/* Error */}
      {errorMsg && (
        <div className="card mb-4" style={{ background: '#FEF2F2', borderColor: '#FCA5A5', border: '1.5px solid #FCA5A5', color: '#991B1B', fontSize: '0.88rem' }}>
          <strong>Error:</strong> {errorMsg}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="card mb-4 text-center" style={{ textAlign: 'center', padding: '36px 20px', background: 'linear-gradient(135deg, #FFF9FA 0%, #F5F3FF 100%)' }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: '50%',
            border: '4px solid #FDE8ED', borderTopColor: 'var(--primary)',
            animation: 'spin 0.75s linear infinite', margin: '0 auto 16px'
          }} />
          <p style={{ fontSize: '1rem', color: '#1F2421', fontWeight: '800', marginBottom: '6px' }}>
            Gemini AI Chef is Cooking...
          </p>
          <div style={{
            fontSize: '0.86rem',
            color: 'var(--primary)',
            fontWeight: '600',
            background: 'white',
            display: 'inline-block',
            padding: '6px 16px',
            borderRadius: '999px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            transition: 'all 0.3s ease'
          }}>
            {LOADING_MESSAGES[loadingStep]}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !aiResult && !errorMsg && (
        <div className="card text-center" style={{ textAlign: 'center', padding: '44px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <IconUtensils size={42} color="#CBD5E1" />
          </div>
          <h3 style={{ fontSize: '1.05rem', color: '#1F2421', marginBottom: '6px' }}>
            Ready to find your perfect meal?
          </h3>
          <p style={{ fontSize: '0.84rem', color: '#5C6460' }}>
            Select your mood & time above, then click <strong>Ask Gemini Chef</strong>
          </p>
        </div>
      )}

      {/* Results */}
      {aiResult && !loading && (
        <>
          {/* Greeting card */}
          <div className="card mb-4" style={{ borderLeft: '4px solid var(--primary)', background: 'linear-gradient(135deg, white, #FDE8ED20)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <IconSparkles size={14} color="var(--primary)" /> Gemini AI Chef
              </span>
              <span className="chip badge-quick" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                {mood}
              </span>
              <span className="chip badge-comfort" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                {EFFORT_OPTIONS.find(e => e.id === effort)?.label}
              </span>
              <span className="chip badge-protein" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                {craving}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#6B7280', marginLeft: 'auto', fontWeight: '600' }}>
                {aiResult.recommendations?.length || 0} recipes loaded (scroll for more)
              </span>
            </div>
            <p style={{ fontSize: '0.94rem', color: '#1F2421', lineHeight: '1.55', marginBottom: aiResult.chefTip ? '10px' : 0 }}>
              {aiResult.aiGreeting}
            </p>
            {aiResult.chefTip && (
              <div style={{
                fontSize: '0.82rem',
                color: 'var(--accent-sage)',
                background: 'var(--accent-sage-light)',
                padding: '8px 12px',
                borderRadius: '10px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '6px'
              }}>
                <IconSparkles size={14} color="var(--accent-sage)" />
                <span>{aiResult.chefTip}</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ fontSize: '1.05rem', color: '#1F2421', margin: 0, fontWeight: '700' }}>
              Your AI Recommendations:
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#5C6460' }}>
              Showing <strong>{aiResult.recommendations?.length || 0}</strong> unique dishes
            </span>
          </div>

          {/* Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {aiResult.recommendations?.map((recipe, idx) => (
              <MealCard
                key={`${recipe.id || recipe.title}-${idx}`}
                recipe={recipe}
                onSelectRecipe={onSelectRecipe}
                pantryItems={pantryItems}
              />
            ))}
          </div>

          {/* Infinite scroll sentinel & status */}
          <div ref={sentinelRef} style={{ textAlign: 'center', padding: '16px 0', minHeight: '60px' }}>
            {loadingMore && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 18px', borderRadius: '999px', background: 'white', border: '1.5px solid var(--primary-border)', fontSize: '0.82rem', color: 'var(--primary)', fontWeight: '700' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #FDE8ED', borderTopColor: 'var(--primary)', animation: 'spin 0.6s linear infinite' }} />
                <span>Streaming more recipes on scroll...</span>
              </div>
            )}

            {!loadingMore && hasMore && (
              <button
                type="button"
                onClick={handleLoadMore}
                className="btn-secondary"
                style={{ padding: '10px 24px', fontSize: '0.86rem', borderRadius: '999px' }}
              >
                <IconSparkles size={15} />
                <span>Scroll or Click to Load More Dishes</span>
              </button>
            )}

            {!hasMore && (
              <div style={{ fontSize: '0.8rem', color: '#9CA3AF', fontWeight: '600' }}>
                You have explored all fresh recommendations for this mood!
              </div>
            )}
          </div>
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
