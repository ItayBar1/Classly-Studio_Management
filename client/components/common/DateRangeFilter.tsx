import React from "react";

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
}

const DateField: React.FC<DateFieldProps> = ({ label, value, onChange, min, max }) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
      {label}
    </label>
    <input
      type="date"
      value={value}
      min={min}
      max={max}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
    />
  </div>
);

interface DateRangeFilterProps {
  from: string;
  to: string;
  onChange: (range: { from: string; to: string }) => void;
}

/**
 * Two labelled date inputs (from / to) rendered as sibling grid cells.
 * Shared by the instructor and manager attendance views.
 */
export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  from,
  to,
  onChange,
}) => (
  <>
    <DateField
      label="מתאריך"
      value={from}
      max={to || undefined}
      onChange={(v) => onChange({ from: v, to })}
    />
    <DateField
      label="עד תאריך"
      value={to}
      min={from || undefined}
      onChange={(v) => onChange({ from, to: v })}
    />
  </>
);
