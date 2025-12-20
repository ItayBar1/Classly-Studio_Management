import React, { useState, useEffect } from 'react';
import { UserService, InvitationService, StudioService, BranchService, RoomService } from '../../services/api';
import { Loader2, Copy, Check, Users, UserPlus, Building, Edit, Save, X, MapPin, Plus, Trash2, Mail, Phone } from 'lucide-react';
import { Studio, Branch, User, Room } from '../../types/types';

import { BranchModal } from './BranchModal';

export const Administration: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [studio, setStudio] = useState<Studio | null>(null);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [instructors, setInstructors] = useState<User[]>([]);

    // UI State
    const [inviteLink, setInviteLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'details' | 'team' | 'branches'>('details');

    // Forms State
    const [isEditingStudio, setIsEditingStudio] = useState(false);
    const [studioForm, setStudioForm] = useState<Partial<Studio>>({});

    // Create Mode (New User)
    const [createForm, setCreateForm] = useState({
        name: '', description: '', contact_email: '', contact_phone: '', website_url: '',
        branchName: 'Main Branch', branchAddress: '', branchCity: '', branchPhone: ''
    });

    // Branch Management State
    const [isbranchModalOpen, setIsBranchModalOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [branchForm, setBranchForm] = useState<Partial<Branch>>({ name: '', address: '', city: '', phone_number: '', is_active: true });




    const fetchData = async () => {
        try {
            const studioData = await StudioService.getMyStudio();
            setStudio(studioData);
            setStudioForm(studioData); // Pre-fill edit form

            // Load branches
            const branchesData = await BranchService.getAll();
            setBranches(branchesData);

            // Load Rooms
            const roomsData = await RoomService.getAll();
            setRooms(roomsData);

            // Load Instructors
            const instructorsData = await UserService.getInstructors();
            setInstructors(instructorsData);

        } catch (err: any) {
            if (err.response && err.response.status === 404) {
                setStudio(null); // Show create form
            } else {
                console.error('Failed to load data', err);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- Studio Actions ---

    const handleCreateStudio = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); // Re-use global loader or local
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
            await StudioService.create(payload);
            await fetchData(); // Refresh all data
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'שגיאה ביצירת הסטודיו');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStudio = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!studio) return;
        try {
            await StudioService.update(studio.id, studioForm);
            setIsEditingStudio(false);
            fetchData();
        } catch (err: any) {
            setError(err.message);
        }
    };

    // --- Branch Actions ---

    const openBranchModal = (branch?: Branch) => {
        if (branch) {
            setEditingBranch(branch);
            setBranchForm(branch);
        } else {
            setEditingBranch(null);
            setBranchForm({ name: '', address: '', city: '', phone_number: '', is_active: true });
        }
        setIsBranchModalOpen(true);
    };



    const handleDeleteBranch = async (id: string) => {
        if (!confirm('האם אתה בטוח שברצונך למחוק סניף זה?')) return;
        try {
            await BranchService.delete(id);
            fetchData();
        } catch (err: any) {
            setError(err.message);
        }
    };

    // --- Invite Actions ---
    const generateInvite = async (role: 'INSTRUCTOR' | 'ADMIN') => {
        try {
            const response = await InvitationService.create(role);
            setInviteLink(response.link);
        } catch (err: any) {
            setError(err.response?.data?.error || 'שגיאה ביצירת ההזמנה');
        }
    };


    if (loading && !studio && !createForm.name) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-600" /></div>;

    // View 1: Create Studio Form
    if (!studio) {
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

                        {error && <div className="text-red-500 text-sm">{error}</div>}

                        <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition">צור את הסטודיו שלי</button>
                    </form>
                </div>
            </div>
        )
    }

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

            {/* Error Banner */}
            {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>}

            {/* TAB: Details */}
            {activeTab === 'details' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex justify-between mb-6">
                        <h3 className="font-bold text-lg">מידע על הסטודיו</h3>
                        <button onClick={() => setIsEditingStudio(!isEditingStudio)} className="text-indigo-600 text-sm flex items-center gap-1 hover:underline"><Edit size={16} /> ערוך</button>
                    </div>
                    {isEditingStudio ? (
                        <form onSubmit={handleUpdateStudio} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input className="border p-2 rounded" value={studioForm.name} onChange={e => setStudioForm({ ...studioForm, name: e.target.value })} placeholder="שם הסטודיו" />
                                <input className="border p-2 rounded" value={studioForm.contact_phone} onChange={e => setStudioForm({ ...studioForm, contact_phone: e.target.value })} placeholder="טלפון" />
                                <input className="border p-2 rounded" value={studioForm.contact_email} onChange={e => setStudioForm({ ...studioForm, contact_email: e.target.value })} placeholder="אימייל" />
                                <input className="border p-2 rounded" value={studioForm.website_url} onChange={e => setStudioForm({ ...studioForm, website_url: e.target.value })} placeholder="אתר אינטרנט" />
                            </div>
                            <textarea className="w-full border p-2 rounded" rows={3} value={studioForm.description || ''} onChange={e => setStudioForm({ ...studioForm, description: e.target.value })} placeholder="תיאור" />
                            <div className="flex gap-2 justify-end">
                                <button type="button" onClick={() => setIsEditingStudio(false)} className="px-4 py-2 text-slate-500">ביטול</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">שמור שינויים</button>
                            </div>
                        </form>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                            <div><span className="text-slate-500 block">שם</span> <span className="font-medium text-slate-800">{studio.name}</span></div>
                            <div><span className="text-slate-500 block">טלפון</span> <span className="font-medium text-slate-800">{studio.contact_phone || '-'}</span></div>
                            <div><span className="text-slate-500 block">אימייל</span> <span className="font-medium text-slate-800">{studio.contact_email || '-'}</span></div>
                            <div><span className="text-slate-500 block">אתר אינטרנט</span> <span className="font-medium text-slate-800">{studio.website_url || '-'}</span></div>
                            <div className="col-span-2"><span className="text-slate-500 block">תיאור</span> <span className="text-slate-800">{studio.description || '-'}</span></div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB: Branches */}
            {activeTab === 'branches' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-lg">ניהול סניפים</h3>
                        <button onClick={() => openBranchModal()} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-indigo-700"><Plus size={16} /> הוסף סניף</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {branches.map(branch => (
                            <div key={branch.id} className="bg-white p-5 rounded-xl border border-slate-200 hover:border-indigo-300 transition shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-slate-800 flex items-center gap-2"><MapPin size={16} className="text-indigo-500" /> {branch.name}</h4>
                                    <div className="flex gap-1">
                                        <button onClick={() => openBranchModal(branch)} className="text-slate-400 hover:text-indigo-600 p-1"><Edit size={16} /></button>
                                        <button onClick={() => handleDeleteBranch(branch.id)} className="text-slate-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                                <div className="text-sm text-slate-600 space-y-1">
                                    <p>{branch.address}, {branch.city}</p>
                                    <p>{branch.phone_number}</p>

                                    {/* Rooms List */}
                                    <div className="mt-3 pt-3 border-t border-slate-100">
                                        <h5 className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1"><Building size={12} /> חדרים:</h5>
                                        <div className="flex flex-wrap gap-1">
                                            {rooms.filter(r => r.branch_id === branch.id).length > 0 ? (
                                                rooms.filter(r => r.branch_id === branch.id).map(r => (
                                                    <span key={r.id} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                                                        {r.name}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">אין חדרים</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-3 flex justify-between items-center">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${branch.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {branch.is_active ? 'פעיל' : 'לא פעיל'}
                                        </span>
                                        <button
                                            onClick={() => openBranchModal(branch)}
                                            className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100 font-medium"
                                        >
                                            ניהול סניף וחדרים
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <BranchModal
                        isOpen={isbranchModalOpen}
                        onClose={() => setIsBranchModalOpen(false)}
                        onSuccess={fetchData}
                        branch={editingBranch}
                        existingRooms={rooms}
                    />
                </div>
            )}

            {/* TAB: Team (Existing Logic) */}
            {activeTab === 'team' && (
                <div className="space-y-6">
                    {/* Instructors List */}
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
                            <button onClick={() => generateInvite('INSTRUCTOR')} className="w-full bg-indigo-50 text-indigo-700 py-2 rounded font-medium hover:bg-indigo-100 transition">צור קישור</button>
                        </div>

                        {inviteLink && (
                            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded flex items-center justify-between overflow-hidden">
                                <span className="text-sm text-slate-700 flex-1 ml-2 break-all font-mono" dir="ltr">{inviteLink}</span>
                                <button onClick={() => { navigator.clipboard.writeText(inviteLink); setCopied(true); setTimeout(() => setCopied(false), 2000) }} className="text-green-700 hover:text-green-900 flex-shrink-0 p-1 hover:bg-green-100 rounded">
                                    {copied ? <Check size={18} /> : <Copy size={18} />}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
};
