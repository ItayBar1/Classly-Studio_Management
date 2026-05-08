import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtext: string;
  icon: LucideIcon;
  color: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  color,
}) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between hover:shadow-md transition-shadow dark:bg-slate-900 dark:border-slate-800">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {title}
        </p>
        <h3 className="text-2xl font-bold text-slate-800 mt-1 dark:text-slate-100">
          {value}
        </h3>
        <p
          className={`text-xs mt-2 font-medium ${
            subtext.includes("+")
              ? "text-green-600 dark:text-green-400"
              : "text-slate-400 dark:text-slate-500"
          }`}
        >
          {subtext}
        </p>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="text-white" size={24} />
      </div>
    </div>
  );
};
