
import { useState, useEffect, Dispatch, SetStateAction } from 'react';

function getValue<T,>(key: string, initialValue: T | (() => T)): T {
  const savedValue = localStorage.getItem(key);
  if (savedValue) {
    try {
      return JSON.parse(savedValue) as T;
    } catch (error) {
      console.error(`Error parsing localStorage key "${key}":`, error);
      localStorage.removeItem(key); // Remove corrupted data
    }
  }

  if (initialValue instanceof Function) {
    return initialValue();
  }
  return initialValue;
}

// FIX: Explicitly import Dispatch and SetStateAction and use them in the return type.
export function useLocalStorage<T,>(key: string, initialValue: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => getValue(key, initialValue));

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
