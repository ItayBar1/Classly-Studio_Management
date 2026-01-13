import React, { useState } from 'react';
import { Loader2, Building, MapPin } from 'lucide-react';

import { StudioDetailsTab } from './tabs/StudioDetailsTab';
import { BranchManagementTab } from './tabs/BranchManagementTab';
import { TeamManagementTab } from './tabs/TeamManagementTab';

import { useGetMyStudioQuery, useCreateStudioMutation } from '@/store/api/studioApi';
import { useGetBranchesQuery, useGetRoomsQuery } from '@/store/api/branchApi';
import { useGetInstructorsQuery } from '@/store/api/userApi';

export const Administration: React.FC = () => {
    // Redux Queries
    const {
        data: studio,
        isLoading: isStudioLoading,
        error: studioError,
        refetch: refetchStudio
    } = useGetMyStudioQuery();

    const hasStudio = !!studio;

    // Only fetch related data if studio exists
    const {
        data: branches = [],
        refetch: refetchBranches
    } = useGetBranchesQuery(undefined, { skip: !hasStudio });

    const {
        data: rooms = [],
        refetch: refetchRooms
    } = useGetRoomsQuery(undefined, { skip: !hasStudio });

    const {
        data: instructors = [],
        refetch: refetchInstructors
    } = useGetInstructorsQuery(undefined, { skip: !hasStudio });

    const [createStudio, { isLoading: isCreating }] = useCreateStudioMutation();

    const [activeTab, setActiveTab] = useState<'details' | 'team' | 'branches'>('details');

    // Create Mode State
    const [createForm, setCreateForm] = useState({
        name: '', description: '', contact_email: '', contact_phone: '', website_url: '',
        branchName: 'Main Branch', branchAddress: '', branchCity: '', branchPhone: ''
    });
    const [createError, setCreateError] = useState<string | null>(null);

    // Initial Loading State
    if (isStudioLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-600" /></div>;

    const handleCreateStudio = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateError(null);
        try {
            const payload = {
                name: createForm.name,
                description: createForm.description,
                contact_email: createForm.contact_email,
                contact_phone: createForm.contact_phone,
                website_url: createForm.website_url,
                branchData: {
                    name: createForm.branchName,
                    address: createForm.branchAddress,
                    city: createForm.branchCity,
                    phone_number: createForm.branchPhone
                }
            };
            await createStudio(payload).unwrap();
            // Automatically refetches due to 'Studio' tag invalidation
        } catch (err: any) {
            setCreateError(err.data?.error || err.message || 'שגיאה ביצירת הסטודיו');
        }
    };

    // Check if 404 error (Studio not found)
    const isNotFound = studioError && 'status' in studioError && studioError.status === 404;

    // View 1: Create Studio Form (Onboarding)
    if (!studio && isNotFound) {
        return (
            <div className="max-w-3xl mx-auto py-8">
                <div className="bg-white p-8 rounded-xl shadow-lg border border-indigo-100">
                    <div className="text-center mb-8">
                        <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Building className="text-indigo-600" size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">ברוכים הבאים ל-Classly!</h2>
                        <p className="text-slate-600 mt-2">בואו נגדיר את הסטודיו והסניף הראשי שלך.</p>
                    </div>

                    <form onSubmit={handleCreateStudio} className="space-y-6">
                        {/* Studio Details */}
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2"><Building size={18} /> פרטי הסטודיו</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">שם הסטודיו *</label>
                                    <input required type="text" className="w-full border p-2 rounded" value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} placeholder="לדוגמה: יוגה סטודיו שלי" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="tel" className="w-full border p-2 rounded" placeholder="טלפון ליצירת קשר ראשי" value={createForm.contact_phone} onChange={e => setCreateForm({ ...createForm, contact_phone: e.target.value })} />
                                    <input type="email" className="w-full border p-2 rounded" placeholder="אימייל ליצירת קשר ראשי" value={createForm.contact_email} onChange={e => setCreateForm({ ...createForm, contact_email: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        {/* Branch Details */}
                        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                            <h3 className="font-semibold text-indigo-800 mb-3 flex items-center gap-2"><MapPin size={18} /> מיקום הסניף הראשי</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">שם הסניף *</label>
                                    <input required type="text" className="w-full border p-2 rounded" value={createForm.branchName} onChange={e => setCreateForm({ ...createForm, branchName: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">כתובת *</label>
                                    <input required type="text" className="w-full border p-2 rounded" value={createForm.branchAddress} onChange={e => setCreateForm({ ...createForm, branchAddress: e.target.value })} placeholder="לדוגמה: רחוב הרצל 1" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">עיר *</label>
                                        <input required type="text" className="w-full border p-2 rounded" value={createForm.branchCity} onChange={e => setCreateForm({ ...createForm, branchCity: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">טלפון הסניף</label>
                                        <input type="tel" className="w-full border p-2 rounded" value={createForm.branchPhone} onChange={e => setCreateForm({ ...createForm, branchPhone: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {createError && <div className="text-red-500 text-sm">{createError}</div>}

                        <button type="submit" disabled={isCreating} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition flex justify-center">
                            {isCreating ? <Loader2 className="animate-spin" /> : 'צור את הסטודיו שלי'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (studioError) return <div className="text-red-500 text-center p-8">שגיאה בטעינת הנתונים. נסה לרענן.</div>;
    if (!studio) return null; // Should be handled by isStudioLoading or isNotFound

    // View 2: Existing Studio Management
    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Building className="text-indigo-600" /> {studio.name}
                    </h2>
                    <p className="text-slate-500 text-sm">מספר סידורי: <span className="font-mono bg-slate-100 px-2 rounded font-bold">{studio.serial_number}</span></p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setActiveTab('details')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'details' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>פרטים</button>
                    <button onClick={() => setActiveTab('branches')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'branches' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>סניפים</button>
                    <button onClick={() => setActiveTab('team')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'team' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>צוות</button>
                </div>
            </div>

            {/* Tabs Content */}
            {activeTab === 'details' && (
                <StudioDetailsTab studio={studio} onUpdate={refetchStudio} />
            )}

            {activeTab === 'branches' && (
                <BranchManagementTab branches={branches} rooms={rooms} onRefresh={() => { refetchBranches(); refetchRooms(); }} />
            )}

            {activeTab === 'team' && (
                <TeamManagementTab instructors={instructors} />
            )}

        </div>
    );
};
