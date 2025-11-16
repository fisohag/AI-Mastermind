
import { GoogleGenAI, Type } from '@google/genai';
import { GeminiFoodResponse } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const foodNutrientSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: 'A generic, searchable name for the food item (e.g., "Chicken Breast", not "Grilled Chicken Breast with herbs").' },
      calories: { type: Type.NUMBER, description: 'Calories per serving size.' },
      protein: { type: Type.NUMBER, description: 'Grams of protein per serving size.' },
      carbs: { type: Type.NUMBER, description: 'Grams of carbohydrates per serving size.' },
      fat: { type: Type.NUMBER, description: 'Grams of fat per serving size.' },
      servingSize: { type: Type.NUMBER, description: 'The size of a single serving.' },
      servingUnit: { type: Type.STRING, description: 'The unit for the serving size (e.g., "g", "ml", "slice", "cup").' },
      quantity: { type: Type.NUMBER, description: 'The quantity of servings the user mentioned or is visible (e.g., if the user said "2 slices of pizza", quantity is 2 and servingUnit is "slice"). Default to 1 if not specified.' },
    },
    required: ['name', 'calories', 'protein', 'carbs', 'fat', 'servingSize', 'servingUnit', 'quantity'],
  },
};

const callGeminiWithSchema = async (prompt: string, imagePart?: any): Promise<GeminiFoodResponse[]> => {
    try {
        const contents = imagePart ? { parts: [imagePart, { text: prompt }] } : prompt;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                responseMimeType: 'application/json',
                responseSchema: foodNutrientSchema,
            },
        });

        const jsonText = response.text.trim();
        const parsedJson = JSON.parse(jsonText);

        if (Array.isArray(parsedJson) && parsedJson.every(item => 'name' in item && 'calories' in item)) {
            return parsedJson as GeminiFoodResponse[];
        }
        
        console.error("Gemini response did not match expected schema:", parsedJson);
        return [];

    } catch (error) {
        console.error('Error calling Gemini with schema:', error);
        return [];
    }
}

export const parseFoodFromVoice = async (text: string): Promise<GeminiFoodResponse[]> => {
  const prompt = `You are a nutrition assistant. Parse the following text and for each food item you identify, provide its full nutritional information (calories, protein, carbs, fat) for a standard serving size. Also identify the quantity and unit mentioned. Return the data in the specified JSON format.

  Text: "${text}"`;
  return callGeminiWithSchema(prompt);
};

export const identifyFoodFromImage = async (base64ImageData: string, mimeType: string): Promise<GeminiFoodResponse[]> => {
  const prompt = `You are a nutrition assistant. Identify the food items in this image. For each item, provide its full nutritional information (calories, protein, carbs, fat) for a standard serving size. Also provide an estimated quantity and unit for what's visible in the image. Return the result in the specified JSON format. If you cannot identify any food, return an empty array.`;
  const imagePart = {
      inlineData: {
        mimeType,
        data: base64ImageData,
      },
    };
  return callGeminiWithSchema(prompt, imagePart);
};

export const searchFoodWithNutrition = async(query: string): Promise<GeminiFoodResponse[]> => {
    const prompt = `You are a nutrition assistant. The user wants to find nutritional information for a food. The user's query may or may not contain a quantity (e.g., "apple" or "2 bananas"). Parse the following query, identify the food item, and provide its full nutritional information (calories, protein, carbs, fat) for a standard serving size. If a quantity is specified, reflect that in the quantity field. If not, default quantity to 1. Return the data in the specified JSON format.

    Query: "${query}"`;
    return callGeminiWithSchema(prompt);
}
