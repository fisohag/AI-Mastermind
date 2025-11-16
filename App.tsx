
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Goals, LogEntry, MealType, View } from './types';
import Dashboard from './components/Dashboard';
import AddFoodView from './components/AddFoodView';
import Settings from './components/Settings';
import { getCurrentDateString } from './utils/date';
import { PlusIcon, CogIcon, ChartPieIcon } from './components/icons/Icons';

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(getCurrentDateString());
  const [goals, setGoals] = useLocalStorage<Goals | null>('calorie-counter-goals', null);
  const [log, setLog] = useLocalStorage<LogEntry[]>(`calorie-counter-log-${currentDate}`, []);
  const [currentView, setCurrentView] = useState<View>('dashboard');

  useEffect(() => {
    const today = getCurrentDateString();
    if (today !== currentDate) {
      setCurrentDate(today);
      setLog([]);
    }
  }, []);

  // FIX: Adjust parameter type to Omit<LogEntry, 'date'>.
  // The entry from AddFoodView already contains the food `id` and a `logId`.
  // This function only needs to add the `date`.
  const addLogEntry = (entry: Omit<LogEntry, 'date'>) => {
    const newEntry: LogEntry = {
      ...entry,
      date: currentDate,
    };
    setLog(prevLog => [...prevLog, newEntry]);
    setCurrentView('dashboard');
  };

  // FIX: Use `logId` to filter entries, as it's the unique identifier for a log entry.
  const removeLogEntry = (id: number) => {
    setLog(prevLog => prevLog.filter(entry => entry.logId !== id));
  };

  const handleSaveGoals = (newGoals: Goals) => {
    setGoals(newGoals);
    setCurrentView('dashboard');
  };
  
  const totals = useMemo(() => {
    return log.reduce(
      (acc, entry) => {
        acc.calories += entry.calories;
        acc.protein += entry.protein;
        acc.carbs += entry.carbs;
        acc.fat += entry.fat;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [log]);

  const renderView = useCallback(() => {
    if (!goals) {
      return <Settings onSave={handleSaveGoals} isFirstTime={true} />;
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard goals={goals} totals={totals} log={log} onRemoveEntry={removeLogEntry} />;
      case 'add-food':
        return <AddFoodView onAddEntry={addLogEntry} />;
      case 'settings':
        return <Settings goals={goals} onSave={handleSaveGoals} />;
      default:
        return <Dashboard goals={goals} totals={totals} log={log} onRemoveEntry={removeLogEntry} />;
    }
  }, [currentView, goals, totals, log, removeLogEntry, handleSaveGoals]);

  if (!process.env.API_KEY) {
    return (
        <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-md p-8 text-center bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">API Key Not Found</h1>
                <p className="text-gray-700 dark:text-gray-300">
                    The Gemini API key is missing. Please ensure the <code>API_KEY</code> environment variable is set.
                </p>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans">
      <div className="container mx-auto max-w-lg p-4 pb-24">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">Calorie<span className="font-light">Zen</span></h1>
        </header>
        <main>{renderView()}</main>
      </div>

      {goals && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="flex justify-around max-w-lg mx-auto">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`flex-1 flex flex-col items-center p-3 text-sm font-medium transition-colors ${currentView === 'dashboard' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400 hover:text-emerald-500'}`}
            >
              <ChartPieIcon className="w-6 h-6 mb-1" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setCurrentView('add-food')}
              className="flex-1 flex flex-col items-center p-3 text-sm font-medium transition-colors transform -translate-y-4 bg-emerald-600 text-white rounded-full shadow-lg w-16 h-16 justify-center hover:bg-emerald-700"
            >
              <PlusIcon className="w-8 h-8" />
            </button>
            <button
              onClick={() => setCurrentView('settings')}
              className={`flex-1 flex flex-col items-center p-3 text-sm font-medium transition-colors ${currentView === 'settings' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400 hover:text-emerald-500'}`}
            >
              <CogIcon className="w-6 h-6 mb-1" />
              <span>Goals</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};

export default App;
