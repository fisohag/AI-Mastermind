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

  const addLogEntry = (entry: Omit<LogEntry, 'date'>) => {
    const newEntry: LogEntry = {
      ...entry,
      date: currentDate,
    };
    setLog(prevLog => [...prevLog, newEntry]);
    setCurrentView('dashboard');
  };

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
        <div className="flex h-screen items-center justify-center bg-[#0d0d0d]">
            <div className="w-full max-w-md p-8 text-center bg-[#1a1a1a] rounded-lg shadow-lg border border-gray-800">
                <h1 className="text-2xl font-serif text-red-400 mb-4">API Key Not Found</h1>
                <p className="text-gray-400">
                    The Gemini API key is missing. Please ensure the <code>API_KEY</code> environment variable is set.
                </p>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-gray-200 font-sans">
      <div className="container mx-auto max-w-lg p-4 pb-32">
        <header className="flex justify-between items-center mb-8 text-center">
          <div className="w-full">
            <h1 className="text-4xl font-serif text-gray-200 glowing-text">CalorieZen</h1>
          </div>
        </header>
        <main>{renderView()}</main>
      </div>

      {goals && (
        <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg bg-black/50 backdrop-blur-sm border border-gray-800 rounded-2xl shadow-lg">
          <div className="flex justify-around items-center h-20">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`flex-1 flex flex-col items-center justify-center h-full text-sm font-medium transition-colors ${currentView === 'dashboard' ? 'text-white' : 'text-gray-500 hover:text-white'}`}
            >
              <ChartPieIcon className="w-6 h-6 mb-1" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setCurrentView('add-food')}
              className={`flex-1 flex flex-col items-center justify-center h-full text-sm font-medium transition-colors ${currentView === 'add-food' ? 'text-white' : 'text-gray-500 hover:text-white'}`}
            >
              <PlusIcon className="w-7 h-7 mb-1" />
              <span>Add Food</span>
            </button>
            <button
              onClick={() => setCurrentView('settings')}
              className={`flex-1 flex flex-col items-center justify-center h-full text-sm font-medium transition-colors ${currentView === 'settings' ? 'text-white' : 'text-gray-500 hover:text-white'}`}
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
