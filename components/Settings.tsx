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
    <div className="bg-[#1a1a1a] p-6 rounded-lg shadow-lg border border-gray-800">
      <div className="text-center mb-8">
          <h2 className="text-3xl font-serif text-gray-100">
            {isFirstTime ? 'Welcome to CalorieZen' : 'Your Daily Goals'}
          </h2>
          {isFirstTime && <p className="text-gray-400 mt-2">Let's set up your daily goals to get started.</p>}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="calories" className="block text-sm font-medium text-gray-400">Daily Calories (kcal)</label>
          <input
            type="number"
            id="calories"
            name="calories"
            value={formState.calories}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 bg-[#0d0d0d] border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-white"
            required
          />
        </div>
        <div>
          <label htmlFor="protein" className="block text-sm font-medium text-gray-400">Protein (g)</label>
          <input
            type="number"
            id="protein"
            name="protein"
            value={formState.protein}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 bg-[#0d0d0d] border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-white"
            required
          />
        </div>
        <div>
          <label htmlFor="carbs" className="block text-sm font-medium text-gray-400">Carbohydrates (g)</label>
          <input
            type="number"
            id="carbs"
            name="carbs"
            value={formState.carbs}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 bg-[#0d0d0d] border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-white"
            required
          />
        </div>
        <div>
          <label htmlFor="fat" className="block text-sm font-medium text-gray-400">Fat (g)</label>
          <input
            type="number"
            id="fat"
            name="fat"
            value={formState.fat}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 bg-[#0d0d0d] border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-white"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-black bg-white hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white transition-colors"
        >
          {isFirstTime ? 'Get Started' : 'Save Goals'}
        </button>
      </form>
    </div>
  );
};

export default Settings;
