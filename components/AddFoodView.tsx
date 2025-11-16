
import React, { useState, useEffect, useRef } from 'react';
import { Food, MealType, LogEntry, GeminiFoodResult } from '../types';
import { searchFood, findFoodByBarcode } from '../services/foodService';
import { parseFoodFromVoice } from '../services/geminiService';
import { SearchIcon, ScanIcon, MicIcon, XIcon } from './icons/Icons';

// FIX: Add type definitions for the Web Speech API to resolve TypeScript errors.
interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: () => void;
  onend: () => void;
  onerror: (event: any) => void;
  onresult: (event: any) => void;
  start(): void;
  stop(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface AddFoodViewProps {
  // FIX: Adjust parameter type to correctly reflect the data being passed.
  // The entry will have a food `id`, but will be missing the `date`.
  onAddEntry: (entry: Omit<LogEntry, 'date'>) => void;
}

const AddFoodView: React.FC<AddFoodViewProps> = ({ onAddEntry }) => {
  const [activeTab, setActiveTab] = useState<'search' | 'scan' | 'voice'>('search');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [meal, setMeal] = useState<MealType>(MealType.Breakfast);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceResults, setVoiceResults] = useState<{ food: Food; geminiData: GeminiFoodResult }[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Set default meal based on time of day
    const hour = new Date().getHours();
    if (hour < 11) setMeal(MealType.Breakfast);
    else if (hour < 16) setMeal(MealType.Lunch);
    else if (hour < 20) setMeal(MealType.Dinner);
    else setMeal(MealType.Snacks);
  }, []);
  
  useEffect(() => {
    if (activeTab !== 'search') {
      setSearchTerm('');
      setSearchResults([]);
    }
    if (activeTab !== 'voice') {
        stopListening();
        setVoiceTranscript('');
        setVoiceResults([]);
    }
     setError(null);
  }, [activeTab]);

  const handleSearch = async (query: string) => {
    setSearchTerm(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const results = await searchFood(query);
      setSearchResults(results);
    } catch (e) {
      setError('Failed to search for food.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFood = (food: Food, defaultQuantity: number = 1) => {
    setSelectedFood(food);
    setQuantity(defaultQuantity);
    setSearchResults([]);
    setSearchTerm('');
    setVoiceResults([]);
  };

  const handleAddFood = () => {
    if (!selectedFood) return;

    // FIX: Adjust type to match what's passed to onAddEntry.
    const entry: Omit<LogEntry, 'date'> = {
      ...selectedFood,
      logId: Date.now(),
      meal,
      quantity,
    };
    
    // Scale macros based on portion size if necessary
    const scale = (selectedFood.servingSize * quantity) / 100; // Assuming nutrition is per 100g
    // For simplicity here we assume the base calories are per serving unit and just multiply by quantity
    entry.calories = selectedFood.calories * quantity;
    entry.protein = selectedFood.protein * quantity;
    entry.carbs = selectedFood.carbs * quantity;
    entry.fat = selectedFood.fat * quantity;

    onAddEntry(entry);
    setSelectedFood(null);
    setQuantity(1);
  };

  const handleBarcodeScan = async () => {
    setIsLoading(true);
    setError(null);
    // In a real app, this would open the camera. Here we simulate it.
    setTimeout(async () => {
      try {
        const food = await findFoodByBarcode('123456789');
        if (food) {
          handleSelectFood(food);
        } else {
          setError('Barcode not found. Try searching manually.');
        }
      } catch (e) {
        setError('Failed to scan barcode.');
      } finally {
        setIsLoading(false);
      }
    }, 1500);
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in your browser.');
      return;
    }
    
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onstart = () => setIsListening(true);
    recognitionRef.current.onend = () => setIsListening(false);
    recognitionRef.current.onerror = (event) => {
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
    };

    recognitionRef.current.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        setVoiceTranscript(transcript);
        setIsLoading(true);
        setError(null);
        setVoiceResults([]);

        try {
            const parsedItems = await parseFoodFromVoice(transcript);
            if (parsedItems.length === 0) {
              setError("Couldn't identify food from your speech. Please try again.");
            } else {
              const foodFetchPromises = parsedItems.map(async item => {
                const searchRes = await searchFood(item.searchTerm);
                return { food: searchRes[0], geminiData: item }; // Take the first result
              });
              const results = (await Promise.all(foodFetchPromises)).filter(r => r.food);
              setVoiceResults(results);
            }
        } catch (e) {
            setError('Failed to process voice input.');
        } finally {
            setIsLoading(false);
        }
    };
    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
        <p className="mt-4 text-gray-500 dark:text-gray-400">
            {activeTab === 'scan' ? 'Scanning...' : activeTab === 'voice' && !voiceTranscript ? 'Listening...' : 'Processing...'}
        </p>
      </div>;
    }

    if (error) {
        return <div className="text-center p-8 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
            <p>{error}</p>
        </div>
    }

    switch (activeTab) {
      case 'scan':
        return <div className="text-center p-8">
            <p className="mb-4 text-gray-600 dark:text-gray-300">Position the barcode inside the frame.</p>
            <div className="w-64 h-40 mx-auto border-4 border-dashed border-gray-400 dark:border-gray-600 rounded-lg flex items-center justify-center">
                <ScanIcon className="w-16 h-16 text-gray-400 dark:text-gray-500"/>
            </div>
            <button onClick={handleBarcodeScan} className="mt-6 w-full bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-emerald-700 transition-colors">
                Simulate Scan
            </button>
        </div>;
      case 'voice':
        return <div className="text-center p-8">
            <button 
                onClick={isListening ? stopListening : startListening}
                className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${isListening ? 'bg-red-500 animate-pulse' : 'bg-emerald-600 hover:bg-emerald-700'}`}
            >
                <MicIcon className="w-12 h-12 text-white" />
            </button>
            <p className="mt-4 text-gray-600 dark:text-gray-300 min-h-[2.5em]">
                {isListening ? "Listening..." : voiceTranscript ? `You said: "${voiceTranscript}"` : "Tap to speak what you ate."}
            </p>
            {voiceResults.length > 0 && <div className="mt-4 text-left">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200">Did you mean?</h3>
                <ul className="mt-2 space-y-2">
                    {voiceResults.map(({ food, geminiData }, index) => (
                        <li key={index} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg flex justify-between items-center cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/50" onClick={() => handleSelectFood(food, geminiData.quantity)}>
                        <div>
                            <p className="font-medium">{food.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{geminiData.quantity} {geminiData.unit} &bull; {Math.round(food.calories * geminiData.quantity)} kcal</p>
                        </div>
                        </li>
                    ))}
                </ul>
            </div>}
        </div>;
      case 'search':
      default:
        return <div>
            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="e.g., chicken breast"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
            </div>
            {searchResults.length > 0 && (
                <ul className="mt-2 space-y-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map(food => (
                        <li key={food.id} onClick={() => handleSelectFood(food)} className="p-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 cursor-pointer flex justify-between items-center">
                            <span>{food.name}</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">{food.calories} kcal</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>;
    }
  };

  if (selectedFood) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg space-y-4">
        <div className="flex justify-between items-start">
            <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">{selectedFood.name}</h2>
                <p className="text-gray-500 dark:text-gray-400">{Math.round(selectedFood.calories * quantity)} kcal</p>
            </div>
            <button onClick={() => setSelectedFood(null)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                <XIcon className="w-5 h-5 text-gray-600 dark:text-gray-300"/>
            </button>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
            <div><p className="text-sm text-gray-500 dark:text-gray-400">Protein</p><p className="font-semibold">{Math.round(selectedFood.protein * quantity)}g</p></div>
            <div><p className="text-sm text-gray-500 dark:text-gray-400">Carbs</p><p className="font-semibold">{Math.round(selectedFood.carbs * quantity)}g</p></div>
            <div><p className="text-sm text-gray-500 dark:text-gray-400">Fat</p><p className="font-semibold">{Math.round(selectedFood.fat * quantity)}g</p></div>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity ({selectedFood.servingUnit})</label>
            <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(0.1, parseFloat(e.target.value)))}
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meal</label>
            <select value={meal} onChange={(e) => setMeal(e.target.value as MealType)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                {Object.values(MealType).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
        </div>

        <button onClick={handleAddFood} className="w-full bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-emerald-700 transition-colors">
            Add to Today
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
        <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
            <button onClick={() => setActiveTab('search')} className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${activeTab === 'search' ? 'bg-white dark:bg-gray-800 text-emerald-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>Search</button>
            <button onClick={() => setActiveTab('scan')} className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${activeTab === 'scan' ? 'bg-white dark:bg-gray-800 text-emerald-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>Scan</button>
            <button onClick={() => setActiveTab('voice')} className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${activeTab === 'voice' ? 'bg-white dark:bg-gray-800 text-emerald-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>Voice</button>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md min-h-[250px]">
            {renderContent()}
        </div>
    </div>
  );
};

export default AddFoodView;
