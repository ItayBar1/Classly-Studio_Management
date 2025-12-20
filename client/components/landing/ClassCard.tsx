import React from 'react';
import { Zap, BarChart2, Clock } from 'lucide-react';

interface ClassCardProps {
  title: string;
  description: string;
  level: string;
  duration: string;
}

const ClassCard: React.FC<ClassCardProps> = ({ title, description, level, duration }) => {
  return (
    <div className="bg-slate-800 p-6 rounded-xl shadow-lg flex flex-col text-right transition-transform transform hover:-translate-y-2">
      <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 mb-4 flex-grow text-right">{description}</p>
      <div className="flex items-center text-slate-400 text-sm gap-4">
        <div className="flex items-center">
          <BarChart2 size={16} className="ml-1 text-indigo-400" />
          <span>{level}</span>
        </div>
        <div className="flex items-center">
          <Clock size={16} className="ml-1 text-indigo-400" />
          <span>{duration}</span>
        </div>
      </div>
    </div>
  );
};

export default ClassCard;
