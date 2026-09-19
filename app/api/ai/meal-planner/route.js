import { NextResponse } from 'next/server';
import { Type } from '@google/genai';
import { ai } from '@/lib/gemini';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const supabase = createServerSupabaseClient(req);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    // Fetch user profile to verify household and quota
    const { data: profile, error: profError } = await supabase
      .from('profiles')
      .select('id, full_name, city, household_id, dietary_preferences, subscription_tier, monthly_ai_usage')
      .eq('id', user.id)
      .single();

    if (profError || !profile?.household_id) {
      return NextResponse.json({ error: 'User does not belong to an active household kitchen.' }, { status: 400 });
    }

    // Rate limiting / Quota check for public users (free tier = 15 meal plans/month)
    if (profile.subscription_tier === 'free' && profile.monthly_ai_usage >= 15) {
      return NextResponse.json(
        { error: 'Monthly AI generation limit reached for your free tier (15/month). Upgrade to Pro for unlimited plans.' },
        { status: 429 }
      );
    }

    // Retrieve household's currently active pantry items
    const { data: activePantry, error: pantryError } = await supabase
      .from('pantry_items')
      .select('item_name, category, quantity, unit, brand')
      .eq('household_id', profile.household_id)
      .eq('is_active', true);

    if (pantryError) throw pantryError;

    const city = profile.city || 'Mumbai';
    const preferences = profile.dietary_preferences || {};

    const prompt = `
You are the elite culinary architect and aesthetic curator for a modern home kitchen in ${city}.
Create an innovative, cafe-vibe 7-day meal plan (Breakfast, Lunch, Dinner).

Context:
- Active Kitchen Inventory: ${JSON.stringify(activePantry || [])}
- Dietary Preferences: ${JSON.stringify(preferences)}

Directives:
1. Prioritize active pantry ingredients to minimize waste.
2. Dishes must be visually stunning, vibrant, cafe-style, high-protein, and effortless (e.g., Whipped Ricotta Toast with Hot Honey, Cold Brew Chia Parfait, Truffle Cacio e Pepe, Burrata Charred Peach Salad, Sourdough Tartines).
3. Recommend specific trendy, premium grocery brands readily available via quick commerce (e.g., Blinkit, Zepto, Instamart in India) like: 'Blue Tokai', 'Subko Coffee & Bakehouse', 'Urban Platter', 'Epigamia', 'Paul and Mike', 'Naagin Hot Sauce', 'The Whole Truth'.
4. Provide authentic reference recipe hyperlinks from reputable sources (Food52, Serious Eats, NYT Cooking, or verified YouTube cooking channels).

Return STRICT structured JSON matching the provided schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            weekly_plan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.STRING },
                  date: { type: Type.STRING },
                  meals: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        meal_type: { type: Type.STRING },
                        title: { type: Type.STRING },
                        vibe: { type: Type.STRING },
                        brand_recommendations: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING }
                        },
                        recipe_url: { type: Type.STRING },
                        prep_time_minutes: { type: Type.INTEGER },
                        cook_time_minutes: { type: Type.INTEGER },
                        ingredients: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              name: { type: Type.STRING },
                              quantity: { type: Type.NUMBER },
                              unit: { type: Type.STRING },
                              is_pantry_item: { type: Type.BOOLEAN }
                            },
                            required: ['name', 'quantity', 'unit']
                          }
                        },
                        quick_instructions: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING }
                        }
                      },
                      required: ['meal_type', 'title', 'brand_recommendations', 'recipe_url', 'ingredients']
                    }
                  }
                },
                required: ['day', 'meals']
              }
            }
          },
          required: ['weekly_plan']
        }
      }
    });

    const parsedPlan = JSON.parse(response.text);

    // Atomically increment monthly usage counter
    await supabase
      .from('profiles')
      .update({ monthly_ai_usage: (profile.monthly_ai_usage || 0) + 1 })
      .eq('id', user.id);

    return NextResponse.json({
      success: true,
      household_id: profile.household_id,
      plan: parsedPlan.weekly_plan
    });
  } catch (error) {
    console.error('Aesthetic AI Generator Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
