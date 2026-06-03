import React, { useState } from 'react';
import { Studio } from '../../../../types/types';
import { StudioService } from '../../../../services/api';
import { Edit } from 'lucide-react';

interface StudioDetailsTabProps {
    studio: Studio;
    onUpdate: () => void;
}

export const StudioDetailsTab: React.FC<StudioDetailsTabProps> = ({ studio, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState<Partial<Studio>>(studio);
    const [error, setError] = useState<string | null>(null);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await StudioService.update(studio.id, form);
            setIsEditing(false);
            onUpdate();
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between mb-6">
                <h3 className="font-bold text-lg dark:text-slate-100">מידע על הסטודיו</h3>
                <button
                    onClick={() => { setIsEditing(!isEditing); setForm(studio); }}
                    className="text-indigo-600 dark:text-indigo-400 text-sm flex items-center gap-1 hover:underline"
                >
                    <Edit size={16} /> ערוך
                </button>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

            {isEditing ? (
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">שם הסטודיו</label>
                            <input className="w-full border p-2 rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">טלפון</label>
                            <input className="w-full border p-2 rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={form.contact_phone || ''} onChange={e => setForm({ ...form, contact_phone: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">אימייל</label>
                            <input className="w-full border p-2 rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={form.contact_email || ''} onChange={e => setForm({ ...form, contact_email: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">אתר אינטרנט</label>
                            <input className="w-full border p-2 rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={form.website_url || ''} onChange={e => setForm({ ...form, website_url: e.target.value })} />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">תיאור</label>
                        <textarea className="w-full border p-2 rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white" rows={3} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
                    </div>
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-3 text-sm">הגדרות מערכת שעות</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">שעת התחלה (ברירת מחדל: 7)</label>
                                <input type="number" min="0" max="23" className="w-full border p-2 rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={form.schedule_start_hour ?? 7} onChange={e => setForm({ ...form, schedule_start_hour: parseInt(e.target.value) })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">שעת סיום (ברירת מחדל: 23)</label>
                                <input type="number" min="0" max="24" className="w-full border p-2 rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={form.schedule_end_hour ?? 23} onChange={e => setForm({ ...form, schedule_end_hour: parseInt(e.target.value) })} />
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded">ביטול</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">שמור שינויים</button>
                    </div>
                </form>
            ) : (
                <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                    <div><span className="text-slate-500 dark:text-slate-400 block">שם</span> <span className="font-medium text-slate-800 dark:text-slate-100">{studio.name}</span></div>
                    <div><span className="text-slate-500 dark:text-slate-400 block">טלפון</span> <span className="font-medium text-slate-800 dark:text-slate-100">{studio.contact_phone || '-'}</span></div>
                    <div><span className="text-slate-500 dark:text-slate-400 block">אימייל</span> <span className="font-medium text-slate-800 dark:text-slate-100">{studio.contact_email || '-'}</span></div>
                    <div><span className="text-slate-500 dark:text-slate-400 block">אתר אינטרנט</span> <span className="font-medium text-slate-800 dark:text-slate-100">{studio.website_url || '-'}</span></div>
                    <div className="col-span-2"><span className="text-slate-500 dark:text-slate-400 block">תיאור</span> <span className="text-slate-800 dark:text-slate-100">{studio.description || '-'}</span></div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">הגדרות סטודיו</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                        <div><span className="text-slate-500 dark:text-slate-400 block">שעת תחילת יום (מערכת שעות)</span> <span className="font-medium text-slate-800 dark:text-slate-100">{studio.schedule_start_hour ?? 7}:00</span></div>
                        <div><span className="text-slate-500 dark:text-slate-400 block">שעת סיום יום (מערכת שעות)</span> <span className="font-medium text-slate-800 dark:text-slate-100">{studio.schedule_end_hour ?? 23}:00</span></div>
                    </div>
                </div>
                </>
            )}
        </div>
    );
};
