
import React, { useState, useEffect } from 'react';
import { Goals } from '../types';

interface SettingsProps {
  goals?: Goals | null;
  onSave: (goals: Goals) => void;
  isFirstTime?: boolean;
}

const Settings: React.FC<SettingsProps> = ({ goals, onSave, isFirstTime = false }) => {
  const [formState, setFormState] = useState<Goals>({
    calories: 2000,
    protein: 120,
    carbs: 200,
    fat: 65,
  });

  useEffect(() => {
    if (goals) {
      setFormState(goals);
    }
  }, [goals]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prevState => ({
      ...prevState,
      [name]: Number(value),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formState);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      {isFirstTime && (
        <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Welcome to CalorieZen!</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Let's set up your daily goals to get started.</p>
        </div>
      )}
      {!isFirstTime && <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">Your Daily Goals</h2>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="calories" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Daily Calories (kcal)</label>
          <input
            type="number"
            id="calories"
            name="calories"
            value={formState.calories}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            required
          />
        </div>
        <div>
          <label htmlFor="protein" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Protein (g)</label>
          <input
            type="number"
            id="protein"
            name="protein"
            value={formState.protein}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            required
          />
        </div>
        <div>
          <label htmlFor="carbs" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Carbohydrates (g)</label>
          <input
            type="number"
            id="carbs"
            name="carbs"
            value={formState.carbs}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            required
          />
        </div>
        <div>
          <label htmlFor="fat" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fat (g)</label>
          <input
            type="number"
            id="fat"
            name="fat"
            value={formState.fat}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
        >
          {isFirstTime ? 'Get Started' : 'Save Goals'}
        </button>
      </form>
    </div>
  );
};

export default Settings;
