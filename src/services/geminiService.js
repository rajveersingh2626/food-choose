// Real Gemini API Connector for Suhanu's Culinary Companion

async function callGeminiApi(promptText, apiKey) {
  const models = ['gemini-1.5-flash', 'gemini-2.0-flash-lite', 'gemini-2.0-flash'];

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }]
        })
      });

      if (!response.ok) {
        console.warn(`Model ${model} API HTTP error: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (rawText) {
        // Clean JSON formatting from LLM response
        let cleaned = rawText.replace(/```json/gi, '').replace(/```/gi, '').trim();
        const firstChar = cleaned.charAt(0);
        if (firstChar === '{' || firstChar === '[') {
          return JSON.parse(cleaned);
        }
        const jsonMatch = cleaned.match(/[\{\[][\s\S]*[\}\]]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
    } catch (err) {
      console.warn(`Model ${model} error:`, err);
    }
  }

  throw new Error('Could not get response from Gemini API.');
}

// 1. Weekly Meal Plan LLM Generator
export async function generateWeeklyPlanWithGemini({ apiKey, pantryItems, wishes, dietFilter }) {
  const activeGroceries = pantryItems
    .filter(item => item.inStock)
    .map(item => `${item.name} (${item.quantity || 'in stock'})`)
    .join(', ');

  const systemPrompt = `You are a world-class AI Chef assistant making a 7-day custom meal plan for Suhanu.
Suhanu's active in-stock pantry: ${activeGroceries || 'No items currently checked in stock'}.
Her custom wishes/goals: ${wishes || 'None specified'}.
Diet filter target: ${dietFilter || 'All'}.

Instructions:
1. Generate a complete 7-day meal plan (Monday to Sunday) covering Breakfast, Lunch, Afternoon Snack, and Dinner.
2. Account strictly for cooking times and favor dishes using her checked pantry items.
3. List 3-5 "missingSuggestions": grocery items she DOES NOT HAVE that would make her weekly meals even better.
4. Output strictly valid JSON in this structure:
{
  "plan": {
    "Monday": {
      "breakfast": { "title": "Crispy Oats Chilla with Curd", "recipeId": "rec-oats-chilla", "calories": 280, "protein": "14g", "effort": "10 mins" },
      "lunch": { "title": "Toor Dal Tadka with Jeera Rice", "recipeId": "rec-dal-tadka", "calories": 420, "protein": "16g", "effort": "25 mins" },
      "snack": { "title": "Roasted Masala Makhana", "recipeId": "rec-masala-chai-makhana", "calories": 160, "protein": "5g", "effort": "5 mins" },
      "dinner": { "title": "Masala Paneer Bhurji with Toast", "recipeId": "rec-paneer-bhurji", "calories": 380, "protein": "22g", "effort": "15 mins" }
    },
    "Tuesday": { ... },
    "Wednesday": { ... },
    "Thursday": { ... },
    "Friday": { ... },
    "Saturday": { ... },
    "Sunday": { ... }
  },
  "missingSuggestions": [
    { "name": "Fresh Lemons", "reason": "Adds zest to Poha & Chana Chaat", "priority": "High" }
  ],
  "pantryMatchScore": 90
}`;

  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Please enter a valid Gemini API key in settings or .env file.');
  }

  return await callGeminiApi(systemPrompt, apiKey);
}

// 2. Mood & Lowest Effort Food Recommendation LLM Generator
export async function askGeminiChef({ apiKey, mood, effort, craving, customPrompt, pantryItems }) {
  const activeGroceries = pantryItems
    .filter(item => item.inStock)
    .map(item => item.name)
    .join(', ');

  const prompt = `You are an expert AI Chef recommending dishes directly to Suhanu.
Suhanu's mood: ${mood || 'Normal'}.
Effort tolerance: ${effort || '5min'}.
Nutrition focus: ${craving || 'Balanced'}.
Custom request: ${customPrompt || 'None'}.
Available pantry items: ${activeGroceries || 'None checked'}.

Instructions:
1. Account for cooking time strictly! If effort is 5min, recommend meals that take 5 minutes or less.
2. Recommend 3 distinct, creative, delicious recipes matching her mood.
3. Return strictly valid JSON:
{
  "aiGreeting": "Sweet, empathetic personalized greeting for Suhanu",
  "chefTip": "Cooking shortcut tip for Suhanu",
  "recommendations": [
    {
      "id": "rec-llm-1",
      "title": "Dish Name",
      "image": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
      "prepTime": "3 mins",
      "cookTime": "5 mins",
      "effortLevel": "5 Mins Effort",
      "calories": 320,
      "protein": "18g",
      "carbs": "30g",
      "fat": "8g",
      "tags": ["High Protein", "Quick & Easy"],
      "description": "Short delicious description",
      "ingredientsHave": ["Item from pantry 1", "Item from pantry 2"],
      "ingredientsNeed": ["Optional extra"],
      "instructions": ["Step 1", "Step 2", "Step 3"]
    },
    { ... },
    { ... }
  ]
}`;

  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Please configure a valid Gemini API key to get live AI recommendations.');
  }

  return await callGeminiApi(prompt, apiKey);
}

// 3. Dynamic Recipe Generator (Pantry-Matched or Global Unconventional)
export async function fetchLlmRecipes({ apiKey, mode = 'pantry', pantryItems }) {
  const activeGroceries = pantryItems
    .filter(item => item.inStock)
    .map(item => item.name)
    .join(', ');

  let prompt = '';
  if (mode === 'pantry') {
    prompt = `You are an innovative AI Chef creating unconventional, delicious recipes for Suhanu.
Her active in-stock pantry items: ${activeGroceries || 'Rice, Poha, Oats, Dal, Paneer, Spices'}.

Generate 4 unique, creative recipes that strictly utilize her active pantry ingredients. Include exact cooking times, macro stats, and step-by-step instructions.
Return strictly valid JSON array of objects:
[
  {
    "id": "rec-pantry-${Date.now()}-1",
    "title": "Unconventional Recipe Title",
    "image": "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
    "prepTime": "5 mins",
    "cookTime": "10 mins",
    "effortLevel": "15 Mins Effort",
    "calories": 310,
    "protein": "16g",
    "carbs": "40g",
    "fat": "9g",
    "tags": ["Pantry Match", "High Protein"],
    "description": "Creative dish description utilizing her pantry items.",
    "ingredientsHave": ["Item 1", "Item 2"],
    "ingredientsNeed": ["Fresh herbs"],
    "instructions": ["Step 1", "Step 2", "Step 3"]
  }
]`;
  } else {
    prompt = `You are a culinary trendsetter creating exciting, unconventional global fusion recipes for Suhanu.
Generate 4 creative, unconventional global recipes (e.g. Avocado Paneer Toast, Garlic Tofu Bowl, Spiced Oats Chilla Tacos, Mango Cardamom Smoothie Bowl) with strict prep and cook times.

Return strictly valid JSON array of objects:
[
  {
    "id": "rec-global-${Date.now()}-1",
    "title": "Creative Global Dish",
    "image": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
    "prepTime": "5 mins",
    "cookTime": "10 mins",
    "effortLevel": "15 Mins Effort",
    "calories": 290,
    "protein": "15g",
    "carbs": "35g",
    "fat": "8g",
    "tags": ["Global Fusion", "Quick & Easy"],
    "description": "Short description of this creative dish.",
    "ingredientsHave": ["Main ingredient 1", "Spice 2"],
    "ingredientsNeed": ["Garnish"],
    "instructions": ["Step 1", "Step 2", "Step 3"]
  }
]`;
  }

  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Gemini API key is required to generate live LLM recipes.');
  }

  return await callGeminiApi(prompt, apiKey);
}
