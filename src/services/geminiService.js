import { generateOfflineWeeklyPlan, generateOfflineMoodSuggestions } from '../data/mockAiResponses.js';

export async function generateWeeklyPlanWithGemini({ apiKey, pantryItems, wishes, dietFilter }) {
  if (!apiKey || apiKey.trim() === '') {
    // Return smart offline generator response
    return generateOfflineWeeklyPlan(pantryItems, wishes, dietFilter);
  }

  const activeGroceries = pantryItems
    .filter(item => item.inStock)
    .map(item => `${item.name} (${item.quantity || 'available'})`)
    .join(', ');

  const systemPrompt = `You are a warm, personal AI Chef assistant making a weekly meal plan for Suhanu.
Her current available pantry/groceries: ${activeGroceries}.
Her special requests or dietary desires: ${wishes || 'None specified'}.
Target diet filter preference: ${dietFilter || 'All'}.

Instructions:
1. Generate a 7-day meal plan (Monday to Sunday) covering Breakfast, Lunch, Snack, and Dinner.
2. Prioritize dishes that use her available pantry ingredients (Rice, Atta, Poha, Oats, Toor/Rajma/Chana Dal, Paneer, Curd, Spices, Dry Fruits, Makhana).
3. Crucially highlight "missingSuggestions": a list of 3-5 grocery items she DOES NOT HAVE that would make her meals even better.
4. Format the output strictly as JSON with this structure:
{
  "plan": {
    "Monday": {
      "breakfast": { "title": "...", "recipeId": "rec-poha-1", "calories": 280, "protein": "8g", "effort": "10 mins" },
      "lunch": { "title": "...", "recipeId": "rec-dal-tadka", "calories": 420, "protein": "16g", "effort": "25 mins" },
      "snack": { "title": "...", "recipeId": "rec-masala-chai-makhana", "calories": 160, "protein": "5g", "effort": "5 mins" },
      "dinner": { "title": "...", "recipeId": "rec-paneer-bhurji", "calories": 380, "protein": "22g", "effort": "15 mins" }
    },
    ... (Tuesday through Sunday)
  },
  "missingSuggestions": [
    { "name": "...", "reason": "...", "priority": "High" }
  ],
  "pantryMatchScore": 92,
  "notes": "..."
}`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }]
      })
    });

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (rawText) {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
    return generateOfflineWeeklyPlan(pantryItems, wishes, dietFilter);
  } catch (error) {
    console.warn('Gemini API call error, falling back to offline engine:', error);
    return generateOfflineWeeklyPlan(pantryItems, wishes, dietFilter);
  }
}

export async function askGeminiChef({ apiKey, mood, effort, craving, customPrompt, pantryItems }) {
  if (!apiKey || apiKey.trim() === '') {
    return generateOfflineMoodSuggestions(mood, effort, craving, pantryItems);
  }

  const activeGroceries = pantryItems
    .filter(item => item.inStock)
    .map(item => item.name)
    .join(', ');

  const prompt = `You are a loving AI Chef assistant talking directly to Suhanu.
Suhanu feels: ${mood || 'Normal'}.
Effort tolerance: ${effort || 'Quick'}.
Craving/Goal: ${craving || 'Balanced'}.
Custom message: ${customPrompt || ''}.
Her current available pantry: ${activeGroceries}.

Recommend the top 3 absolute BEST and LOWEST EFFORT dishes for her right now.
Respond in JSON format:
{
  "aiGreeting": "Sweet, personalized greeting for Suhanu",
  "chefTip": "Personal cooking shortcut tip for Suhanu",
  "recommendationTitles": ["Dish 1", "Dish 2", "Dish 3"]
}`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (rawText) {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        // Map titles to sample recipes or build objects
        const fallback = generateOfflineMoodSuggestions(mood, effort, craving, pantryItems);
        return {
          aiGreeting: result.aiGreeting || fallback.aiGreeting,
          chefTip: result.chefTip || fallback.chefTip,
          recommendations: fallback.recommendations
        };
      }
    }
    return generateOfflineMoodSuggestions(mood, effort, craving, pantryItems);
  } catch (error) {
    return generateOfflineMoodSuggestions(mood, effort, craving, pantryItems);
  }
}
