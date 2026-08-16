import React, { useState, useEffect } from 'react';
import { generateWeeklyPlanWithGemini } from '../services/geminiService.js';
import { generateOfflineWeeklyPlan } from '../data/mockAiResponses.js';
import { SAMPLE_RECIPES } from '../data/sampleRecipes.js';
import { IconCalendar, IconAlert, IconSparkles, IconBook, IconClock, IconFlame } from './Icons.jsx';

export default function WeeklyPlanner({ pantryItems, apiKey, onSelectRecipe }) {
  const [wishes, setWishes] = useState('');
  const [dietFilter, setDietFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [weeklyPlanData, setWeeklyPlanData] = useState(() => {
    return generateOfflineWeeklyPlan(pantryItems, wishes, dietFilter);
  });
  const [activeDay, setActiveDay] = useState('Monday');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Regenerate initial offline plan whenever pantry checked items change if user hasn't explicitly customized yet
  useEffect(() => {
    if (!weeklyPlanData) {
      setWeeklyPlanData(generateOfflineWeeklyPlan(pantryItems, wishes, dietFilter));
    }
  }, [pantryItems]);

  const handleGeneratePlan = async () => {
    setLoading(true);
    try {
      if (apiKey && apiKey.trim() !== '') {
        const result = await generateWeeklyPlanWithGemini({
          apiKey,
          pantryItems,
          wishes,
          dietFilter
        });
        if (result && result.plan) {
          setWeeklyPlanData(result);
          return;
        }
      }
      // Seamless fallback if API fails or key is empty
      const offline = generateOfflineWeeklyPlan(pantryItems, wishes, dietFilter);
      setWeeklyPlanData(offline);
    } catch (err) {
      console.warn('Live API plan generation failed, using instant smart offline engine:', err);
      const offline = generateOfflineWeeklyPlan(pantryItems, wishes, dietFilter);
      setWeeklyPlanData(offline);
    } finally {
      setLoading(false);
    }
  };

  const getRecipeForMeal = (recipeId, fallbackTitle = '') => {
    let found = SAMPLE_RECIPES.find(r => r.id === recipeId);
    if (!found && fallbackTitle) {
      found = SAMPLE_RECIPES.find(r => r.title.toLowerCase().includes(fallbackTitle.toLowerCase()));
    }
    if (!found) {
      found = SAMPLE_RECIPES[0];
    }
    return found;
  };

  return (
    <div className="animate-fade">
      {/* Top Banner & Wish Input */}
      <div className="card mb-4" style={{ background: 'linear-gradient(135deg, #FAF7F8 0%, #F3E8FF 100%)' }}>
        <h2 style={{ fontSize: '1.2rem', color: '#1F2421', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconCalendar size={20} color="var(--primary)" />
          <span>7-Day Custom Meal Planner</span>
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#5C6460', marginBottom: '14px' }}>
          Specify custom wishes or dietary goals for Suhanu (e.g. "High protein, quick dinners"):
        </p>

        <textarea
          rows={2}
          placeholder="e.g. Cheesy paneer on weekends, high protein breakfast, low cal dinners..."
          value={wishes}
          onChange={(e) => setWishes(e.target.value)}
          style={{
            width: '100%',
            marginBottom: '14px',
            resize: 'vertical'
          }}
        />

        {/* Filter Chips */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {['All', 'High Protein', 'Low Calorie', 'Quick & Easy', 'Comfort Food'].map(filter => (
            <button
              key={filter}
              onClick={() => setDietFilter(filter)}
              className={`chip ${dietFilter === filter ? 'chip-active' : 'chip-inactive'}`}
              style={{ fontSize: '0.78rem' }}
            >
              {filter}
            </button>
          ))}
        </div>

        <button
          onClick={handleGeneratePlan}
          disabled={loading}
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
        >
          <IconSparkles size={18} />
          <span>{loading ? 'Crafting Custom Weekly Plan...' : 'Generate / Refresh 7-Day Meal Plan'}</span>
        </button>
      </div>

      {/* Generated 7-Day Plan */}
      {weeklyPlanData && (
        <>
          {/* Missing Ingredients Inspector Alert */}
          {weeklyPlanData.missingSuggestions && weeklyPlanData.missingSuggestions.length > 0 && (
            <div className="card mb-4" style={{ background: '#FFFBEB', borderColor: '#FCD34D' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <IconAlert size={20} color="#D97706" />
                <h3 style={{ fontSize: '1rem', color: '#1F2421', margin: 0, fontWeight: '700' }}>
                  Missing Grocery Inspector
                </h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#5C6460', marginBottom: '12px' }}>
                Your current checked pantry matches <strong>{weeklyPlanData.pantryMatchScore || 88}%</strong> of this plan! Adding these items will elevate her meals:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '8px' }}>
                {weeklyPlanData.missingSuggestions.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'white',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: '1px solid rgba(0,0,0,0.06)'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', color: '#1F2421', fontSize: '0.88rem' }}>{item.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#5C6460' }}>{item.reason}</div>
                    </div>
                    <span className="chip badge-quick" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                      {item.priority || 'Need'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Days Switcher */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '14px' }}>
            {days.map(day => (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`chip ${activeDay === day ? 'chip-active' : 'chip-inactive'}`}
                style={{ padding: '8px 18px', fontSize: '0.85rem' }}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Active Day Meals Grid */}
          {weeklyPlanData.plan && weeklyPlanData.plan[activeDay] && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
              {['breakfast', 'lunch', 'snack', 'dinner'].map((mealType) => {
                const meal = weeklyPlanData.plan[activeDay][mealType];
                if (!meal) return null;

                const recipeObj = getRecipeForMeal(meal.recipeId, meal.title);

                return (
                  <div key={mealType} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.5px', marginBottom: '4px' }}>
                        {mealType}
                      </div>
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#1F2421', marginBottom: '6px' }}>
                        {meal.title}
                      </h4>
                      <div style={{ fontSize: '0.8rem', color: '#5C6460', display: 'flex', gap: '12px', marginBottom: '14px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <IconClock size={14} /> {meal.effort || '15 mins'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <IconFlame size={14} color="#D97706" /> {meal.calories || 300} kcal
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectRecipe(recipeObj)}
                      className="btn-secondary"
                      style={{ justifyContent: 'center', width: '100%', fontSize: '0.8rem' }}
                    >
                      <IconBook size={14} />
                      <span>View Recipe</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
