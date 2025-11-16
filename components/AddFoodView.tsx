
import React, { useState, useEffect, useRef } from 'react';
import { Food, MealType, LogEntry, GeminiFoodResponse } from '../types';
import { searchFood, findFoodByBarcode } from '../services/foodService';
import { parseFoodFromVoice, identifyFoodFromImage } from '../services/geminiService';
import { SearchIcon, ScanIcon, MicIcon, XIcon, CameraIcon } from './icons/Icons';

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
  const [activeTab, setActiveTab] = useState<'search' | 'scan' | 'voice' | 'photo'>('search');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [meal, setMeal] = useState<MealType>(MealType.Breakfast);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Voice & Photo state
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [geminiResults, setGeminiResults] = useState<GeminiFoodResponse[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);


  useEffect(() => {
    // Set default meal based on time of day
    const hour = new Date().getHours();
    if (hour < 11) setMeal(MealType.Breakfast);
    else if (hour < 16) setMeal(MealType.Lunch);
    else if (hour < 20) setMeal(MealType.Dinner);
    else setMeal(MealType.Snacks);
  }, []);
  
  useEffect(() => {
    // Reset state when switching tabs
    setSearchTerm('');
    setSearchResults([]);
    stopListening();
    setVoiceTranscript('');
    setImagePreview(null);
    setGeminiResults([]);
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
    setGeminiResults([]);
  };

  const handleSelectGeminiFood = (item: GeminiFoodResponse) => {
    const food: Food = {
        id: `${item.name.toLowerCase().replace(/\s/g, '-')}-${Date.now()}`,
        name: item.name,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        servingSize: item.servingSize,
        servingUnit: item.servingUnit,
    };
    setSelectedFood(food);
    setQuantity(item.quantity);
    setGeminiResults([]);
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
    
    // Nutrition facts are per serving, so just multiply by quantity
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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        setImagePreview(dataUrl);
        setIsLoading(true);
        setError(null);
        setGeminiResults([]);

        try {
            const [header, base64Data] = dataUrl.split(',');
            const mimeType = header.match(/:(.*?);/)?.[1];

            if (!base64Data || !mimeType) {
                throw new Error("Invalid image format");
            }

            const parsedItems = await identifyFoodFromImage(base64Data, mimeType);
            if (parsedItems.length === 0) {
              setError("Couldn't identify food from your image. Please try another one.");
            } else {
              setGeminiResults(parsedItems);
            }
        } catch (err) {
            setError('Failed to process image.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
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
        setGeminiResults([]);

        try {
            const parsedItems = await parseFoodFromVoice(transcript);
            if (parsedItems.length === 0) {
              setError("Couldn't identify food from your speech. Please try again.");
            } else {
              setGeminiResults(parsedItems);
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
  
  const renderGeminiResults = () => (
    <div className="mt-4 text-left">
        <h3 className="font-semibold text-gray-700 dark:text-gray-200">Identified Food:</h3>
        <ul className="mt-2 space-y-2">
            {geminiResults.map((item, index) => (
                <li key={index} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg flex justify-between items-center cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/50" onClick={() => handleSelectGeminiFood(item)}>
                <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.quantity} {item.servingUnit} &bull; {Math.round(item.calories * item.quantity)} kcal</p>
                </div>
                </li>
            ))}
        </ul>
    </div>
  );

  const renderContent = () => {
    if (isLoading) {
      return <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
        <p className="mt-4 text-gray-500 dark:text-gray-400">
            {activeTab === 'scan' ? 'Scanning...' : 'Identifying...'}
        </p>
      </div>;
    }

    if (error) {
        return <div className="text-center p-8 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
            <p>{error}</p>
        </div>
    }

    switch (activeTab) {
      case 'photo':
        return (
          <div className="text-center p-8">
            <input
              type="file"
              id="image-upload"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <label
              htmlFor="image-upload"
              className="cursor-pointer group"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Food preview" className="w-64 h-40 mx-auto object-cover rounded-lg mb-4" />
              ) : (
                <div className="w-64 h-40 mx-auto border-4 border-dashed border-gray-400 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center mb-4 group-hover:border-emerald-500 transition-colors">
                  <CameraIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 group-hover:text-emerald-500 transition-colors" />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Upload a photo</p>
                </div>
              )}
            </label>
            {geminiResults.length > 0 && renderGeminiResults()}
          </div>
        );
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
            {geminiResults.length > 0 && renderGeminiResults()}
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
                    placeholder="e.g., 2 slices of pizza"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
            </div>
            {searchResults.length > 0 && (
                <ul className="mt-2 space-y-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map(food => (
                        <li key={food.id} onClick={() => handleSelectFood(food)} className="p-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 cursor-pointer flex justify-between items-center">
                            <span>{food.name}</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">{food.calories} kcal / {food.servingSize}{food.servingUnit}</span>
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
        <div className="grid grid-cols-4 gap-1 bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
            <button onClick={() => setActiveTab('search')} className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${activeTab === 'search' ? 'bg-white dark:bg-gray-800 text-emerald-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>Search</button>
            <button onClick={() => setActiveTab('scan')} className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${activeTab === 'scan' ? 'bg-white dark:bg-gray-800 text-emerald-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>Scan</button>
            <button onClick={() => setActiveTab('voice')} className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${activeTab === 'voice' ? 'bg-white dark:bg-gray-800 text-emerald-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>Voice</button>
            <button onClick={() => setActiveTab('photo')} className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${activeTab === 'photo' ? 'bg-white dark:bg-gray-800 text-emerald-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>Photo</button>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md min-h-[250px]">
            {renderContent()}
        </div>
    </div>
  );
};

export default AddFoodView;
