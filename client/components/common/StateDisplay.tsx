import React from "react";
import { Loader2, AlertCircle, LucideIcon } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "טוען נתונים...",
  className = "h-64",
}) => {
  return (
    <div
      className={`flex items-center justify-center text-slate-400 dark:text-slate-500 ${className}`}
    >
      <Loader2 className="animate-spin ml-2" size={24} />
      <span>{message}</span>
    </div>
  );
};

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  onRetry,
  className = "h-64",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${className}`}
    >
      <AlertCircle className="text-red-500 mb-3" size={40} />
      <p className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-4">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 rounded-lg font-medium transition-colors"
        >
          נסה שוב
        </button>
      )}
    </div>
  );
};

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className = "h-64",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm ${className}`}
    >
      <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
        <Icon className="text-indigo-500 dark:text-indigo-400" size={32} />
      </div>
      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
