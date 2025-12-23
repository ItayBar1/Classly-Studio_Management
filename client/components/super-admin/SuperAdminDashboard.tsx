import React from 'react';
import {
    Building2,
    Users,
    Activity,
    ShieldCheck
} from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">מבט על - מנהל פלטפורמה</h2>
                    <p className="text-slate-500">ברוך שובך, אתה מחובר כ-Super Admin.</p>
                </div>
                <div className="text-sm text-slate-500 bg-slate-100 px-4 py-2 rounded-full">
                    {new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">ניהול הפלטפורמה</h1>
                        <p className="text-purple-100 max-w-xl text-lg">
                            כאן תוכל לנהל את כל הסטודיואים, המשתמשים וההגדרות של המערכת הגלובלית.
                        </p>
                    </div>
                    <ShieldCheck size={64} className="text-purple-200 opacity-50" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                        <Building2 size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">ניהול סטודיואים</h3>
                        <p className="text-sm text-slate-500">צפה ונהל את כל הסטודיואים הרשומים</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-lg text-green-600">
                        <Users size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">משתמשים פעילים</h3>
                        <p className="text-sm text-slate-500">סטטיסטיקות משתמשים בזמן אמת</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-orange-100 rounded-lg text-orange-600">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">ביצועי מערכת</h3>
                        <p className="text-sm text-slate-500">ניטור עומסים וביצועים</p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4">פעולות מהירות</h3>
                <p className="text-slate-500">
                    לביצוע פעולות ניהול מתקדמות, אנא עבור ללשונית "ניהול" בתפריט הצד.
                </p>
            </div>
        </div>
    );
};
