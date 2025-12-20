import React, { useState } from 'react';
import { InvitationService } from '../../services/api';
import { Loader2, Copy, Check, Briefcase, UserPlus } from 'lucide-react';

export const PlatformAdministration: React.FC = () => {
    const [inviteLink, setInviteLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const generateInvite = async () => {
        try {
            const response = await InvitationService.create('ADMIN');
            setInviteLink(response.link);
        } catch (err) {
            console.error('Failed to generate invite', err);
        }
    };

    const copyToClipboard = () => {
        if (inviteLink) {
            navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Briefcase className="text-purple-600" size={24} />
                    ניהול פלטפורמה (Super Admin)
                </h2>

                <p className="text-slate-600 mb-6">
                    כאן תוכל לנהל את כל הסטודיואים בפלטפורמה.
                </p>

                <div className="border border-slate-200 rounded-lg p-4 hover:border-purple-300 transition-colors bg-purple-50">
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2 text-purple-900">
                        <UserPlus size={20} className="text-purple-600" />
                        הזמנת מנהל סטודיו חדש
                    </h3>
                    <p className="text-sm text-purple-700 mb-4">
                        צור קישור הרשמה ייחודי למנהל סטודיו חדש. הקישור יאפשר להם להקים סטודיו חדש במערכת.
                    </p>
                    <button
                        onClick={generateInvite}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors w-full md:w-auto"
                    >
                        צור קישור להזמנת מנהל
                    </button>
                </div>

                {inviteLink && (
                    <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-100 animate-fadeIn">
                        <h4 className="text-green-800 font-medium mb-2">קישור ההזמנה לסטודיו חדש נוצר!</h4>
                        <div className="flex items-center gap-2 bg-white p-2 rounded border border-green-200">
                            <input
                                type="text"
                                readOnly
                                value={inviteLink}
                                className="flex-1 bg-transparent text-sm text-slate-600 outline-none"
                            />
                            <button
                                onClick={copyToClipboard}
                                className="text-purple-600 hover:text-purple-800 p-1"
                                title="העתק קישור"
                            >
                                {copied ? <Check size={18} /> : <Copy size={18} />}
                            </button>
                        </div>
                        <p className="text-xs text-green-600 mt-2">
                            שלח קישור זה למנהל הסטודיו החדש.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
