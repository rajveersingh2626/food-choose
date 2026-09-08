import React, { useState, useCallback } from 'react';
import { generateWeeklyPlanWithGemini, getFoodPhotoUrl } from '../services/geminiService.js';
import FoodImage from './FoodImage.jsx';
import {
  IconCalendar,
  IconAlert,
  IconSparkles,
  IconBook,
  IconClock,
  IconFlame,
  IconDownload,
  IconCopy,
  IconCheck,
  IconSun,
  IconSunHigh,
  IconCoffee,
  IconMoon,
  IconDumbbell,
  IconMessageSquare,
  IconLeaf
} from './Icons.jsx';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const MEAL_META = {
  breakfast: { icon: <IconSun size={14} color="#E7829A" />, color: '#E7829A', label: 'Breakfast' },
  lunch:     { icon: <IconSunHigh size={14} color="#F59E0B" />, color: '#F59E0B', label: 'Lunch' },
  snack:     { icon: <IconCoffee size={14} color="#8B5CF6" />, color: '#8B5CF6', label: 'Snack' },
  dinner:    { icon: <IconMoon size={14} color="#2563EB" />, color: '#2563EB', label: 'Dinner' }
};

function PlannerMealCard({ meal, mealType, onView, pantryItems }) {
  if (!meal) return null;
  const meta = MEAL_META[mealType] || MEAL_META.breakfast;
  const imgSrc = getFoodPhotoUrl(meal.title, meal.photoSearchQuery);

  const pantryNames = (pantryItems || []).filter(i => i.inStock).map(i => i.name.toLowerCase());
  const haveCount = (meal.ingredientsHave || []).length;
  const needCount = (meal.ingredientsNeed || []).length;
  const isFullyPantry = needCount === 0 && haveCount > 0;

  const recipeObj = {
    id: `planner-${mealType}-${meal.title?.replace(/\s+/g, '-').toLowerCase()}`,
    title: meal.title,
    prepTime: meal.prepTime || '5 mins',
    cookTime: meal.cookTime || '10 mins',
    effortLevel: `${meal.prepTime || '5 mins'} prep + ${meal.cookTime || '10 mins'} cook`,
    calories: meal.calories || 320,
    protein: meal.protein || '14g',
    carbs: meal.carbs || '38g',
    fat: meal.fat || '10g',
    tags: [meta.label, isFullyPantry ? '100% In Pantry' : `${needCount} to buy`],
    description: meal.description || `A custom ${mealType} crafted for your weekly plan.`,
    photoSearchQuery: meal.photoSearchQuery || '',
    ingredientsHave: meal.ingredientsHave || ['Check your pantry items'],
    ingredientsNeed: meal.ingredientsNeed || [],
    instructions: meal.instructions || [
      `Prepare fresh ingredients for ${meal.title}.`,
      `Cook with your pantry spices for the indicated time.`,
      `Serve immediately and enjoy!`
    ]
  };

  return (
    <div
      className="card card-hover"
      style={{
        padding: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        borderTop: `3px solid ${meta.color}`,
        transition: 'transform 0.18s ease, box-shadow 0.18s ease'
      }}
    >
      {/* Food photo */}
      <div style={{ position: 'relative', height: '135px', overflow: 'hidden', background: '#F0EBF0' }}>
        <FoodImage
          src={imgSrc}
          alt={meal.title}
          title={meal.title}
          query={meal.photoSearchQuery}
          height="135px"
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)'
        }} />

        {/* Meal label */}
        <div style={{
          position: 'absolute',
          top: '8px',
          left: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(6px)',
          padding: '3px 10px',
          borderRadius: '999px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>{meta.icon}</div>
          <span style={{ fontSize: '0.68rem', fontWeight: '800', color: meta.color, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            {meta.label}
          </span>
        </div>

        {/* Pantry status badge */}
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '10px',
          background: isFullyPantry ? 'rgba(46, 125, 50, 0.9)' : needCount > 0 ? 'rgba(217, 119, 6, 0.9)' : 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          color: 'white',
          fontSize: '0.68rem',
          fontWeight: '700',
          padding: '3px 8px',
          borderRadius: '999px'
        }}>
          {isFullyPantry ? '✓ In Pantry' : needCount > 0 ? `+${needCount} to buy` : 'Pantry Match'}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', flex: 1, gap: '8px' }}>
        <h4 style={{ fontSize: '0.92rem', fontWeight: '700', color: '#1F2421', lineHeight: '1.3', margin: 0 }}>
          {meal.title}
        </h4>

        <div style={{ display: 'flex', gap: '8px', fontSize: '0.74rem', color: '#5C6460', flexWrap: 'wrap' }}>
          {meal.prepTime && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <IconClock size={11} color="#8B5CF6" /> {meal.prepTime} prep
            </span>
          )}
          {meal.cookTime && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <IconFlame size={11} color="#D97706" /> {meal.cookTime} cook
            </span>
          )}
          {meal.calories && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#D97706' }}>
              <IconFlame size={11} color="#D97706" /> {meal.calories} kcal
            </span>
          )}
          {meal.protein && (
            <span style={{ fontWeight: '700', color: '#2E7D32', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <IconDumbbell size={11} color="#2E7D32" /> {meal.protein}
            </span>
          )}
        </div>

        {meal.description && (
          <p style={{ fontSize: '0.76rem', color: '#6B7280', margin: 0, lineHeight: '1.4' }}>
            {meal.description}
          </p>
        )}

        <button
          onClick={() => onView(recipeObj)}
          className="btn-secondary"
          style={{ justifyContent: 'center', width: '100%', fontSize: '0.78rem', marginTop: 'auto', padding: '7px 12px' }}
        >
          <IconBook size={13} />
          <span>Recipe & Ingredients</span>
        </button>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ textAlign: 'center', padding: '48px 16px' }}>
      <div style={{
        width: '56px', height: '56px', borderRadius: '50%',
        border: '4px solid #FDE8ED', borderTopColor: 'var(--primary)',
        animation: 'spin 0.9s linear infinite', margin: '0 auto 18px'
      }} />
      <p style={{ color: '#1F2421', fontWeight: '700', fontSize: '1.05rem', marginBottom: '6px' }}>
        Gemini AI is Crafting Your 7-Day Plan...
      </p>
      <p style={{ color: '#5C6460', fontSize: '0.85rem', maxWidth: '400px', margin: '0 auto' }}>
        Taking your pantry and custom feedback into serious consideration for breakfast, lunch, snack & dinner!
      </p>
    </div>
  );
}

export default function WeeklyPlanner({ pantryItems, apiKey, onSelectRecipe }) {
  const [wishes, setWishes] = useState('');
  const [dietFilter, setDietFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [weeklyPlanData, setWeeklyPlanData] = useState(null);
  const [activeDay, setActiveDay] = useState('Monday');
  const [error, setError] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);

  // User comments & feedback on the plan — treated VERY seriously by AI
  const [userComments, setUserComments] = useState('');
  const [appliedFeedback, setAppliedFeedback] = useState('');
  const [copyToast, setCopyToast] = useState('');

  const generatePlan = useCallback(async (filterOverride, commentsOverride) => {
    const filterToUse = filterOverride !== undefined ? filterOverride : dietFilter;
    const commentsToUse = commentsOverride !== undefined ? commentsOverride : userComments;

    setLoading(true);
    setError('');
    try {
      const result = await generateWeeklyPlanWithGemini({
        apiKey,
        pantryItems,
        wishes,
        dietFilter: filterToUse,
        userComments: commentsToUse
      });

      if (result?.plan) {
        setWeeklyPlanData(result);
        setHasGenerated(true);
        setActiveDay('Monday');
        if (commentsToUse && commentsToUse.trim()) {
          setAppliedFeedback(commentsToUse.trim());
        }
      } else {
        setError('Could not generate plan. Please try again.');
      }
    } catch (err) {
      console.error('Plan error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [apiKey, pantryItems, wishes, dietFilter, userComments]);

  const handleFilterChip = (filter) => {
    setDietFilter(filter);
    if (hasGenerated) generatePlan(filter, userComments);
  };

  const handleApplyFeedback = (e) => {
    e.preventDefault();
    if (!userComments.trim()) return;
    generatePlan(dietFilter, userComments);
  };

  // Export 7-day meal plan & shopping list
  const generateExportText = () => {
    if (!weeklyPlanData?.plan) return '';

    let text = `=====================================================\n`;
    text += `SUHANU'S 7-DAY PERSONAL MEAL PLAN\n`;
    text += `Diet Focus: ${dietFilter}\n`;
    if (appliedFeedback) {
      text += `Custom AI Feedback Applied: "${appliedFeedback}"\n`;
    }
    text += `Generated on: ${new Date().toLocaleDateString()}\n`;
    text += `=====================================================\n\n`;

    const allNeeded = new Set();

    DAYS.forEach(day => {
      const dayData = weeklyPlanData.plan[day];
      if (!dayData) return;
      text += `DAY: ${day.toUpperCase()}\n`;
      text += `-----------------------------------------------------\n`;

      ['breakfast', 'lunch', 'snack', 'dinner'].forEach(mealType => {
        const meal = dayData[mealType];
        if (meal) {
          text += `  • [${mealType.toUpperCase()}] ${meal.title}\n`;
          text += `    Time: ${meal.prepTime || '5m'} prep + ${meal.cookTime || '10m'} cook | ${meal.calories || 300} kcal | ${meal.protein || '15g'} protein\n`;
          if (meal.description) text += `    Note: ${meal.description}\n`;
          if (meal.ingredientsNeed && meal.ingredientsNeed.length > 0) {
            meal.ingredientsNeed.forEach(item => allNeeded.add(item));
          }
        }
      });
      text += `\n`;
    });

    // Consolidated grocery list
    text += `=====================================================\n`;
    text += `CONSOLIDATED GROCERY SHOPPING LIST (ITEMS TO BUY)\n`;
    text += `=====================================================\n`;

    if (weeklyPlanData.missingSuggestions?.length > 0) {
      weeklyPlanData.missingSuggestions.forEach(item => {
        text += `[ ] ${item.name}${item.reason ? ` — (${item.reason})` : ''}\n`;
      });
    }

    allNeeded.forEach(item => {
      text += `[ ] ${item}\n`;
    });

    if (allNeeded.size === 0 && (!weeklyPlanData.missingSuggestions || weeklyPlanData.missingSuggestions.length === 0)) {
      text += `All meals are 100% covered by your current pantry items! No extra shopping needed.\n`;
    }

    return text;
  };

  const handleDownloadPlan = () => {
    const text = generateExportText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Suhanu_Weekly_Meal_Plan_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Plan downloaded as .txt!');
  };

  const handleCopyPlan = () => {
    const text = generateExportText();
    navigator.clipboard.writeText(text).then(() => {
      showToast('Weekly plan copied to clipboard!');
    });
  };

  const showToast = (msg) => {
    setCopyToast(msg);
    setTimeout(() => setCopyToast(''), 3000);
  };

  // Compute total day nutrition
  const dayPlan = weeklyPlanData?.plan?.[activeDay];
  const dayTotals = dayPlan ? {
    calories: ['breakfast', 'lunch', 'snack', 'dinner'].reduce((s, m) => s + (dayPlan[m]?.calories || 0), 0),
    protein: ['breakfast', 'lunch', 'snack', 'dinner'].reduce((s, m) => s + parseInt(dayPlan[m]?.protein || '0'), 0)
  } : null;

  return (
    <div className="animate-fade">
      {/* Toast popup */}
      {copyToast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#1F2421',
          color: 'white',
          padding: '10px 18px',
          borderRadius: '12px',
          fontSize: '0.86rem',
          fontWeight: '600',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <IconCheck size={16} color="#86EFAC" />
          <span>{copyToast}</span>
        </div>
      )}

      {/* Config Card */}
      <div className="card mb-4" style={{ background: 'linear-gradient(135deg, #FAF7F8 0%, #F3E8FF 100%)' }}>
        <h2 style={{ fontSize: '1.25rem', color: '#1F2421', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
          <IconCalendar size={22} color="var(--primary)" />
          <span>My 7-Day AI Meal Plan</span>
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#5C6460', marginBottom: '14px' }}>
          Gemini will curate all 7 days of meals matched to your active pantry items ({pantryItems.filter(i => i.inStock).length} in stock).
        </p>

        {/* Wishes / Initial thoughts */}
        <textarea
          rows={2}
          placeholder="e.g. High protein breakfasts, something spicy on weekends, light dinners, quick 10-min snacks..."
          value={wishes}
          onChange={(e) => setWishes(e.target.value)}
          style={{ width: '100%', marginBottom: '12px', resize: 'vertical', borderRadius: '12px', padding: '10px 14px', border: '1.5px solid rgba(0,0,0,0.1)', fontSize: '0.88rem', outline: 'none', fontFamily: 'inherit', background: 'white' }}
        />

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
          {['All', 'High Protein', 'Low Calorie', 'Quick & Easy', 'Comfort Food', 'Vegan'].map(filter => (
            <button
              key={filter}
              onClick={() => handleFilterChip(filter)}
              className={`chip ${dietFilter === filter ? 'chip-active' : 'chip-inactive'}`}
              style={{ fontSize: '0.78rem' }}
            >
              {filter}
            </button>
          ))}
        </div>

        <button
          onClick={() => generatePlan()}
          disabled={loading}
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '0.96rem' }}
        >
          <IconSparkles size={18} />
          <span>{loading ? 'Crafting Your 7-Day Plan...' : hasGenerated ? 'Regenerate My Plan' : 'Generate My 7-Day Plan'}</span>
        </button>

        {error && (
          <p style={{ color: '#DC2626', fontSize: '0.82rem', marginTop: '10px', textAlign: 'center' }}>{error}</p>
        )}
      </div>

      {/* Empty State */}
      {!loading && !weeklyPlanData && (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: '#9CA3AF' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <IconCalendar size={44} color="#CBD5E1" />
          </div>
          <p style={{ fontWeight: '700', color: '#6B7280', fontSize: '1.05rem', marginBottom: '6px' }}>
            Your personalised 7-day plan will appear here
          </p>
          <p style={{ fontSize: '0.85rem' }}>
            Add any preferences or cravings above, then click Generate!
          </p>
        </div>
      )}

      {loading && <LoadingSkeleton />}

      {/* Generated Plan */}
      {!loading && weeklyPlanData?.plan && (
        <>
          {/* USER FEEDBACK & COMMENTS BAR (TAKEN VERY SERIOUSLY BY AI) */}
          <div className="card mb-4" style={{ background: 'linear-gradient(135deg, #FFF9FA 0%, #FFF5F7 100%)', border: '1.5px solid #F9A8D4' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconMessageSquare size={18} color="#9D174D" />
                <span style={{ fontWeight: '800', color: '#9D174D', fontSize: '0.92rem' }}>
                  Have Comments or Tweaks on This Plan?
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', background: '#FCE7F3', color: '#BE185D', padding: '3px 10px', borderRadius: '999px', fontWeight: '700' }}>
                Gemini takes your feedback VERY seriously
              </span>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#6B7280', marginBottom: '10px' }}>
              Want to swap out a dish, reduce cooking time, or make Wednesday completely dairy-free? Type your feedback below:
            </p>

            <form onSubmit={handleApplyFeedback} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={userComments}
                onChange={(e) => setUserComments(e.target.value)}
                placeholder="e.g. 'No eggs on Tuesday', 'Make dinner lighter', 'Add butter chicken on Friday', 'I want more oats'..."
                style={{ flex: 1, minWidth: '240px', background: 'white', borderRadius: '10px', fontSize: '0.86rem', padding: '9px 12px', border: '1.5px solid rgba(0,0,0,0.1)' }}
              />
              <button
                type="submit"
                disabled={loading || !userComments.trim()}
                className="btn-primary"
                style={{ padding: '9px 16px', fontSize: '0.84rem', whiteSpace: 'nowrap' }}
              >
                <IconSparkles size={14} />
                <span>Apply Feedback & Regenerate</span>
              </button>
            </form>

            {appliedFeedback && (
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.85)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.78rem' }}>
                <span style={{ color: '#BE185D', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <IconCheck size={14} color="#BE185D" />
                  <span><strong>Active Feedback:</strong> "{appliedFeedback}"</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAppliedFeedback('');
                    setUserComments('');
                    generatePlan(dietFilter, '');
                  }}
                  style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '0.74rem', textDecoration: 'underline' }}
                >
                  Clear feedback
                </button>
              </div>
            )}
          </div>

          {/* Action Bar: Export Table & Match Score */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            {/* Pantry match status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                background: '#ECFDF5',
                color: '#065F46',
                border: '1px solid #A7F3D0',
                padding: '5px 12px',
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <IconLeaf size={14} color="#065F46" />
                <span>{weeklyPlanData.pantryMatchScore || 90}% Pantry Match</span>
              </span>
            </div>

            {/* Export buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleCopyPlan}
                className="btn-outline"
                style={{ padding: '7px 14px', fontSize: '0.8rem' }}
                title="Copy full 7-day meal plan & shopping list to clipboard"
              >
                <IconCopy size={15} />
                <span>Copy Week</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPlan}
                className="btn-primary"
                style={{ padding: '7px 16px', fontSize: '0.8rem' }}
                title="Download 7-day plan as text file"
              >
                <IconDownload size={15} />
                <span>Export My Week</span>
              </button>
            </div>
          </div>

          {/* Missing groceries recommendation */}
          {weeklyPlanData.missingSuggestions?.length > 0 && (
            <div className="card mb-4" style={{ background: '#FFFBEB', border: '1.5px solid #FCD34D' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <IconAlert size={18} color="#D97706" />
                <span style={{ fontWeight: '700', color: '#1F2421', fontSize: '0.9rem' }}>
                  Recommended To Buy For This Week:
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {weeklyPlanData.missingSuggestions.map((item, idx) => (
                  <div key={idx} style={{
                    background: 'white',
                    padding: '5px 12px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    border: '1px solid rgba(0,0,0,0.08)',
                    color: '#374151'
                  }}>
                    <span style={{ fontWeight: '600' }}>+ {item.name}</span>
                    {item.reason && <span style={{ color: '#9CA3AF', marginLeft: '4px' }}>— {item.reason}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Day Switcher */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '14px' }}>
            {DAYS.map((day, i) => (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`chip ${activeDay === day ? 'chip-active' : 'chip-inactive'}`}
                style={{ padding: '8px 14px', fontSize: '0.82rem', flexShrink: 0 }}
              >
                <span className="hide-mobile">{day}</span>
                <span className="show-mobile">{DAY_SHORT[i]}</span>
              </button>
            ))}
          </div>

          {/* Day Header + Totals */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#1F2421', margin: 0 }}>
              {activeDay}'s Schedule
            </h3>
            {dayTotals && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ background: '#FDE8ED', color: '#E7829A', padding: '4px 12px', borderRadius: '999px', fontSize: '0.76rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <IconFlame size={12} color="#E7829A" /> {dayTotals.calories} kcal
                </span>
                <span style={{ background: '#E8F5E9', color: '#2E7D32', padding: '4px 12px', borderRadius: '999px', fontSize: '0.76rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <IconDumbbell size={12} color="#2E7D32" /> {dayTotals.protein}g protein
                </span>
              </div>
            )}
          </div>

          {dayPlan ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
              {['breakfast', 'lunch', 'snack', 'dinner'].map((mealType) => (
                <PlannerMealCard
                  key={mealType}
                  meal={dayPlan[mealType]}
                  mealType={mealType}
                  onView={onSelectRecipe}
                  pantryItems={pantryItems}
                />
              ))}
            </div>
          ) : (
            <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '24px' }}>
              No meals planned for {activeDay}.
            </p>
          )}
        </>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
