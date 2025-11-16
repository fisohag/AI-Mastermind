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
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg mb-4 overflow-hidden">
      <button
        className="w-full flex justify-between items-center p-4"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div>
          <h3 className="text-lg font-semibold text-gray-200">{meal}</h3>
          <p className="text-sm text-gray-500">{Math.round(totalCalories)} calories</p>
        </div>
        {isOpen ? <ChevronUpIcon className="w-5 h-5 text-gray-500" /> : <ChevronDownIcon className="w-5 h-5 text-gray-500" />}
      </button>
      {isOpen && (
        <div className="px-4 pb-4">
          {entries.length > 0 ? (
            <ul className="divide-y divide-gray-800">
              {entries.map(entry => (
                <li key={entry.logId} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-100">{entry.name}</p>
                    <p className="text-sm text-gray-500">
                      {entry.quantity} {entry.servingUnit} &bull; {Math.round(entry.calories * entry.quantity)} kcal
                    </p>
                  </div>
                  <button onClick={() => onRemove(entry.logId)} className="text-gray-500 hover:text-red-500 p-2 rounded-full transition-colors">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 italic py-2">No items logged for {meal}.</p>
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
    <div className="space-y-8">
      <div className="bg-[#1a1a1a] p-6 rounded-xl shadow-lg border border-gray-800 glowing-border flex items-center justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex justify-between items-baseline">
             <span className="font-serif text-3xl text-gray-200">Remaining</span>
             <span className={`font-bold text-3xl ${remainingCalories >= 0 ? 'text-white' : 'text-red-400'}`}>
              {Math.round(remainingCalories)}
            </span>
          </div>
          <div className="border-t border-gray-800 my-2"></div>
          <div className="flex justify-between items-baseline text-sm">
            <span className="text-gray-400">Eaten</span>
            <span className="font-semibold text-gray-200">{Math.round(totals.calories)}</span>
          </div>
          <div className="flex justify-between items-baseline text-sm">
            <span className="text-gray-400">Goal</span>
            <span className="font-semibold text-gray-200">{goals.calories}</span>
          </div>
        </div>
        <div className="ml-6">
            <CircularProgress percentage={caloriePercentage} />
        </div>
      </div>
      
      <div className="bg-[#1a1a1a] p-4 rounded-xl shadow-md border border-gray-800 space-y-4">
        <MacroBar label="Protein" current={totals.protein} goal={goals.protein} color="bg-gray-400" unit="g" />
        <MacroBar label="Carbs" current={totals.carbs} goal={goals.carbs} color="bg-gray-500" unit="g" />
        <MacroBar label="Fat" current={totals.fat} goal={goals.fat} color="bg-gray-600" unit="g" />
      </div>

      <div>
        <h2 className="text-2xl font-serif mb-4 text-gray-300">Today's Log</h2>
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
