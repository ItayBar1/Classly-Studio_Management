import React from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

export const FormInput: React.FC<FormInputProps> = ({ label, error, className = '', ...props }) => {
    return (
        <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">{label}</label>
            <input
                className={`w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${className}`}
                {...props}
            />
            {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
    );
};

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    options: { value: string | number; label: string }[];
    error?: string;
    placeholder?: string;
}

export const FormSelect: React.FC<FormSelectProps> = ({ label, options, error, placeholder, className = '', ...props }) => {
    return (
        <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">{label}</label>
            <select
                className={`w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white ${className}`}
                {...props}
            >
                {placeholder && <option value="" disabled>{placeholder}</option>}
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
    );
};
