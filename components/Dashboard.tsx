
import React, { useState } from 'react';
import { Goals, LogEntry, MealType } from '../types';
import CircularProgress from './common/CircularProgress';
import MacroBar from './common/MacroBar';
import { TrashIcon, ChevronDownIcon, ChevronUpIcon } from './icons/Icons';

interface DashboardProps {
  goals: Goals;
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  log: LogEntry[];
  onRemoveEntry: (id: number) => void;
}

const MealSection: React.FC<{
  meal: MealType;
  entries: LogEntry[];
  onRemove: (id: number) => void;
}> = ({ meal, entries, onRemove }) => {
  const [isOpen, setIsOpen] = useState(true);
  const totalCalories = entries.reduce((sum, entry) => sum + entry.calories * entry.quantity, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-4 overflow-hidden">
      <button
        className="w-full flex justify-between items-center p-4"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{meal}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{Math.round(totalCalories)} calories</p>
        </div>
        {isOpen ? <ChevronUpIcon className="w-5 h-5 text-gray-500" /> : <ChevronDownIcon className="w-5 h-5 text-gray-500" />}
      </button>
      {isOpen && (
        <div className="px-4 pb-4">
          {entries.length > 0 ? (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {entries.map(entry => (
                <li key={entry.logId} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{entry.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {entry.quantity} {entry.servingUnit} &bull; {Math.round(entry.calories * entry.quantity)} kcal
                    </p>
                  </div>
                  <button onClick={() => onRemove(entry.logId)} className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-2 rounded-full transition-colors">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic py-2">No items logged.</p>
          )}
        </div>
      )}
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ goals, totals, log, onRemoveEntry }) => {
  const remainingCalories = goals.calories - totals.calories;
  const caloriePercentage = goals.calories > 0 ? (totals.calories / goals.calories) * 100 : 0;
  
  const groupedLog = log.reduce((acc, entry) => {
    (acc[entry.meal] = acc[entry.meal] || []).push(entry);
    return acc;
  }, {} as Record<MealType, LogEntry[]>);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex items-center justify-between">
        <div className="flex-1 space-y-1">
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-gray-500 dark:text-gray-400">Eaten</span>
            <span className="font-bold text-2xl text-emerald-600 dark:text-emerald-400">{Math.round(totals.calories)}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-gray-500 dark:text-gray-400">Goal</span>
            <span className="font-semibold text-lg text-gray-700 dark:text-gray-300">{goals.calories}</span>
          </div>
           <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Remaining</span>
            <span className={`font-bold text-2xl ${remainingCalories >= 0 ? 'text-gray-800 dark:text-gray-100' : 'text-red-500 dark:text-red-400'}`}>
              {Math.round(remainingCalories)}
            </span>
          </div>
        </div>
        <div className="ml-6">
            <CircularProgress percentage={caloriePercentage} />
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md space-y-4">
        <MacroBar label="Protein" current={totals.protein} goal={goals.protein} color="bg-blue-500" unit="g" />
        <MacroBar label="Carbs" current={totals.carbs} goal={goals.carbs} color="bg-orange-500" unit="g" />
        <MacroBar label="Fat" current={totals.fat} goal={goals.fat} color="bg-pink-500" unit="g" />
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4 text-gray-700 dark:text-gray-300">Today's Log</h2>
        {(Object.keys(MealType) as Array<keyof typeof MealType>).map(mealKey => (
            <MealSection
              key={mealKey}
              meal={MealType[mealKey]}
              entries={groupedLog[MealType[mealKey]] || []}
              onRemove={onRemoveEntry}
            />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
