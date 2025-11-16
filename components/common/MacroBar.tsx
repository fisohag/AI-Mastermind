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
        <span className="text-sm font-medium text-gray-300">{label}</span>
        <span className="text-sm text-gray-500">
          {Math.round(current)}{unit} / {goal}{unit}
        </span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>
    </div>
  );
};

export default MacroBar;
