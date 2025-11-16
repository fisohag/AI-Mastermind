
import React from 'react';

interface MacroBarProps {
  label: string;
  current: number;
  goal: number;
  color: string;
  unit: string;
}

const MacroBar: React.FC<MacroBarProps> = ({ label, current, goal, color, unit }) => {
  const percentage = goal > 0 ? (current / goal) * 100 : 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {Math.round(current)}{unit} / {goal}{unit}
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
        <div
          className={`${color} h-2.5 rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>
    </div>
  );
};

export default MacroBar;
