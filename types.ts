
export interface Food {
  id: string;
  name: string;
  calories: number; // per 100g or per serving
  protein: number;
  carbs: number;
  fat: number;
  servingSize: number; // in grams
  servingUnit: string; // e.g., 'g', 'slice', 'cup'
}

export interface LogEntry extends Food {
  logId: number;
  date: string;
  meal: MealType;
  quantity: number;
}

export interface Goals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export enum MealType {
  Breakfast = 'Breakfast',
  Lunch = 'Lunch',
  Dinner = 'Dinner',
  Snacks = 'Snacks',
}

export type View = 'dashboard' | 'add-food' | 'settings';

export interface GeminiFoodResponse {
  name: string;
  calories: number; // per serving size
  protein: number;
  carbs: number;
  fat: number;
  servingSize: number;
  servingUnit: string;
  quantity: number;
}
