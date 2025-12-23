import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';

export const Settings: React.FC = () => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <SettingsIcon className="text-indigo-600" size={24} />
                הגדרות סטודיו
            </h2>
            <p className="text-slate-500">
                עמוד זה בבנייה. כאן יהיו הגדרות הסטודיו בעתיד.
            </p>
        </div>
    );
};
