
import { GoogleGenAI, Type } from '@google/genai';
import { GeminiFoodResult } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      searchTerm: {
        type: Type.STRING,
        description: 'A generic, searchable name for the food item.',
      },
      quantity: {
        type: Type.NUMBER,
        description: 'The quantity of the food item mentioned.',
      },
      unit: {
        type: Type.STRING,
        description: 'The unit for the quantity (e.g., "slice", "cup", "serving").',
      },
    },
    required: ['searchTerm', 'quantity', 'unit'],
  },
};

export const parseFoodFromVoice = async (text: string): Promise<GeminiFoodResult[]> => {
  const prompt = `You are a nutrition assistant. Parse the following text and return a structured JSON object of the food items mentioned. For each item, provide a generic search term, a quantity, and a unit.

  Text: "${text}"`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    });

    const jsonText = response.text.trim();
    const parsedJson = JSON.parse(jsonText);

    // Basic validation to ensure it's an array of objects with the correct keys
    if (Array.isArray(parsedJson) && parsedJson.every(item => 'searchTerm' in item && 'quantity' in item && 'unit' in item)) {
        return parsedJson as GeminiFoodResult[];
    }
    
    console.error("Gemini response did not match expected schema:", parsedJson);
    return [];

  } catch (error) {
    console.error('Error parsing food from voice with Gemini:', error);
    return [];
  }
};
