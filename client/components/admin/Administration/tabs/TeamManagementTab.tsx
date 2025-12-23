import React, { useState } from 'react';
import { User } from '../../../../types/types';
import { InvitationService } from '../../../../services/api';
import { Mail, Phone, Users, UserPlus, Copy, Check } from 'lucide-react';

interface TeamManagementTabProps {
    instructors: User[];
}

export const TeamManagementTab: React.FC<TeamManagementTabProps> = ({ instructors }) => {
    const [inviteLink, setInviteLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateInvite = async (role: 'INSTRUCTOR' | 'ADMIN') => {
        try {
            setError(null);
            const response = await InvitationService.create(role);
            setInviteLink(response.link);
        } catch (err: any) {
            setError(err.response?.data?.error || 'שגיאה ביצירת ההזמנה');
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-lg mb-4">המדריכים שלי</h3>
                {instructors.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {instructors.map((instructor) => (
                            <div key={instructor.id} className="flex items-center gap-4 p-4 border border-slate-100 rounded-lg hover:border-indigo-100 transition shadow-sm">
                                <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg">
                                    {instructor.profile_image_url ? (
                                        <img src={instructor.profile_image_url} alt={instructor.full_name} className="h-12 w-12 rounded-full object-cover" />
                                    ) : (
                                        instructor.full_name?.charAt(0).toUpperCase() || '?'
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800">{instructor.full_name}</h4>
                                    <div className="text-xs text-slate-500 flex flex-col gap-1">
                                        <span className="flex items-center gap-1"><Mail size={12} /> {instructor.email}</span>
                                        {instructor.phone_number && <span className="flex items-center gap-1"><Phone size={12} /> {instructor.phone_number}</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-500">
                        <Users className="mx-auto h-12 w-12 opacity-20 mb-2" />
                        <p>עדיין אין מדריכים בצוות.</p>
                    </div>
                )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-lg mb-4">ניהול הזמנות</h3>
                <div className="p-4 border border-slate-200 rounded-lg max-w-md">
                    <h4 className="font-medium mb-2 flex items-center gap-2"><UserPlus size={18} className="text-indigo-500" /> הזמן מדריך</h4>
                    <p className="text-sm text-slate-500 mb-4">צור קישור הזמנה ייחודי למדריך חדש.</p>
                    {error && <div className="text-red-500 text-sm mb-2 bg-red-50 p-2 rounded">{error}</div>}
                    <button onClick={() => generateInvite('INSTRUCTOR')} className="w-full bg-indigo-50 text-indigo-700 py-2 rounded font-medium hover:bg-indigo-100 transition">צור קישור</button>
                </div>

                {inviteLink && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded flex items-center justify-between overflow-hidden animate-fadeIn">
                        <span className="text-sm text-slate-700 flex-1 ml-2 break-all font-mono" dir="ltr">{inviteLink}</span>
                        <button onClick={() => { navigator.clipboard.writeText(inviteLink); setCopied(true); setTimeout(() => setCopied(false), 2000) }} className="text-green-700 hover:text-green-900 flex-shrink-0 p-1 hover:bg-green-100 rounded">
                            {copied ? <Check size={18} /> : <Copy size={18} />}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
