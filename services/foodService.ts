
import { Food } from '../types';
import { searchFoodWithNutrition } from './geminiService';

// Mock food database - kept for barcode scanning simulation
const mockFoodDatabase: Food[] = [
  { id: '1', name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, servingSize: 100, servingUnit: 'g' },
  { id: '2', name: 'Apple', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, servingSize: 100, servingUnit: 'g' },
  { id: '3', name: 'Pasta (Cooked)', calories: 131, protein: 5, carbs: 25, fat: 1.1, servingSize: 100, servingUnit: 'g' },
  { id: '4', name: 'Brown Rice (Cooked)', calories: 112, protein: 2.3, carbs: 23.5, fat: 0.8, servingSize: 100, servingUnit: 'g' },
  { id: '5', name: 'Salmon', calories: 208, protein: 20, carbs: 0, fat: 13, servingSize: 100, servingUnit: 'g' },
  { id: '6', name: 'Whole Wheat Bread', calories: 247, protein: 13, carbs: 41, fat: 3.4, servingSize: 100, servingUnit: 'g' },
  { id: '7', name: 'Peanut Butter', calories: 588, protein: 25, carbs: 20, fat: 50, servingSize: 100, servingUnit: 'g' },
  { id: '8', name: 'Pizza Slice', calories: 285, protein: 12, carbs: 36, fat: 10, servingSize: 107, servingUnit: 'slice' },
  { id: '9', name: 'Coca-Cola', calories: 139, protein: 0, carbs: 37, fat: 0, servingSize: 355, servingUnit: 'can' },
  { id: '10', name: 'Banana', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, servingSize: 100, servingUnit: 'g' },
  { id: '11', name: 'Protein Bar', calories: 200, protein: 20, carbs: 22, fat: 6, servingSize: 50, servingUnit: 'bar' },
];

export const searchFood = async (query: string): Promise<Food[]> => {
  console.log(`Searching for: ${query} using Gemini`);
  if (!query) return [];

  try {
    const geminiResults = await searchFoodWithNutrition(query);
    // Transform Gemini response to the app's Food type
    const foods: Food[] = geminiResults.map(item => ({
      id: `${item.name.toLowerCase().replace(/\s/g, '-')}-${Date.now()}`, // Create a semi-unique ID
      name: item.name,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      servingSize: item.servingSize,
      servingUnit: item.servingUnit,
    }));
    return foods;
  } catch (error) {
    console.error('Error searching food with Gemini:', error);
    return [];
  }
};

export const findFoodByBarcode = async (barcode: string): Promise<Food | null> => {
  console.log(`Looking up barcode: ${barcode}`);
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In a real app, you'd map barcodes to specific product IDs.
  // Here, we'll just return a specific item for demonstration.
  if (barcode === '123456789') {
    return mockFoodDatabase[10]; // Protein Bar
  }
  return null;
};
