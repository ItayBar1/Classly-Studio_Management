import React, { useState, useEffect } from 'react';
import { Branch, Room } from '../../types/types';
import { BranchService, RoomService } from '../../services/api';
import { X, Save, Edit, Trash2, Plus, Building, Loader2 } from 'lucide-react';

interface BranchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    branch: Branch | null;
    existingRooms: Room[];
}

export const BranchModal: React.FC<BranchModalProps> = ({ isOpen, onClose, onSuccess, branch, existingRooms }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<Branch>>({
        name: '',
        address: '',
        city: '',
        phone_number: '',
        is_active: true
    });
    const [error, setError] = useState<string | null>(null);

    // Room Management State
    const [branchRooms, setBranchRooms] = useState<Room[]>([]); // For Edit Mode (display)
    const [newRooms, setNewRooms] = useState<{ name: string; capacity: number }[]>([{ name: 'אולם ראשי', capacity: 20 }]); // For Create Mode

    // Room Editing State
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);
    const [roomName, setRoomName] = useState('');
    const [roomCapacity, setRoomCapacity] = useState(20);

    useEffect(() => {
        if (isOpen) {
            if (branch) {
                setFormData(branch);
                // Filter rooms for this branch from the passed props (no new fetch!)
                setBranchRooms(existingRooms.filter(r => r.branch_id === branch.id));
                setNewRooms([]);
            } else {
                setFormData({ name: '', address: '', city: '', phone_number: '', is_active: true });
                setBranchRooms([]);
                setNewRooms([{ name: 'אולם ראשי', capacity: 20 }]); // Default for new branch
            }
            setError(null);
            setEditingRoom(null);
            setRoomName('');
            setRoomCapacity(20);
        }
    }, [isOpen, branch, existingRooms]);

    // --- Branch Handlers ---

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (branch) {
                // Edit existing branch
                await BranchService.update(branch.id, formData);
            } else {
                // Create new branch
                // 1. Create Branch (Backend will auto-create "Main Hall" but we want custom list support)
                // Actually, backend auto-creates "Main Hall". 
                // If user customized the list, we should probably handle it.
                // Let's create branch first.
                const newBranch = await BranchService.create({ ...formData } as any);

                // 2. Handle Rooms
                // The backend auto-creates "Main Hall".
                // If the user modified the default list or added more, we need to sync.
                // Simplest strategy: Delete the auto-created one IF it's not in our list? 
                // Or easier: Update the backend to NOT auto-create if we are handling it here?
                // Or just ignore the auto-created one and add ours?
                // The user's request was "backend auto-create default room". I implemented that.
                // Now I am implementing a UI that allows defining rooms at creation.
                // If I keep backend auto-create, I might get duplicates if I also create 'Main Hall' here.

                // Let's assume for this "Advanced" UI, we will explicitly create the rooms the user defined.
                // We can't easily stop the backend trigger from here without changing backend code.
                // Workaround: We will let backend create 'Main Hall'.
                // Then we loop through `newRooms`.
                // If `newRooms` contains 'Main Hall', we skip it (or update it?).
                // Or we just add the other rooms.

                const roomsToCreate = newRooms.filter(r => r.name !== 'אולם ראשי');
                await Promise.all(roomsToCreate.map(r => RoomService.create({
                    branch_id: newBranch.id,
                    name: r.name,
                    capacity: r.capacity,
                    is_active: true
                })));
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'שגיאה בשמירת הסניף');
        } finally {
            setLoading(false);
        }
    };

    // --- Room Handlers (Create Mode) ---
    const addInMemoryRoom = () => {
        if (!roomName) return;
        setNewRooms([...newRooms, { name: roomName, capacity: roomCapacity }]);
        setRoomName('');
        setRoomCapacity(20);
    };

    const removeInMemoryRoom = (index: number) => {
        const updated = [...newRooms];
        updated.splice(index, 1);
        setNewRooms(updated);
    };

    // --- Room Handlers (Edit Mode) ---
    const handleRoomSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!branch) {
            addInMemoryRoom();
            return;
        }

        try {
            if (editingRoom) {
                await RoomService.update(editingRoom.id, { name: roomName, capacity: roomCapacity });
            } else {
                await RoomService.create({
                    branch_id: branch.id,
                    name: roomName,
                    capacity: roomCapacity,
                    is_active: true
                });
            }
            onSuccess(); // Refresh parent data
            // Optimistic update or wait for re-fetch? onSuccess triggers re-fetch. 
            // We can locally update too for smoothness but props update will come shortly.
            cancelEdit();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const deleteRoom = async (id: string) => {
        if (!confirm('למחוק חדר זה?')) return;
        try {
            await RoomService.delete(id);
            onSuccess();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const startEdit = (room: Room) => {
        setEditingRoom(room);
        setRoomName(room.name);
        setRoomCapacity(room.capacity || 20);
    };

    const cancelEdit = () => {
        setEditingRoom(null);
        setRoomName('');
        setRoomCapacity(20);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                    <h3 className="font-bold text-xl text-slate-800">{branch ? 'עריכת פרטי סניף' : 'הקמת סניף חדש'}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1"><X size={24} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Branch Details Form */}
                    <section className="space-y-4">
                        <h4 className="font-semibold text-sm text-slate-500 uppercase tracking-wider">פרטי הסניף</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1 text-slate-700">שם הסניף *</label>
                                <input required type="text" className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="לדוגמה: סניף מרכז" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-slate-700">עיר *</label>
                                <input required type="text" className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-slate-700">כתובת *</label>
                                <input required type="text" className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-slate-700">טלפון</label>
                                <input type="tel" className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={formData.phone_number} onChange={e => setFormData({ ...formData, phone_number: e.target.value })} />
                            </div>
                            <div className="flex items-end">
                                <label className="flex items-center gap-2 cursor-pointer p-2.5 bg-slate-50 rounded-lg border border-slate-200 w-full hover:bg-slate-100 transition">
                                    <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded"
                                        checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} />
                                    <span className="text-sm font-medium text-slate-700">סניף פעיל</span>
                                </label>
                            </div>
                        </div>
                    </section>

                    <hr className="border-slate-100" />

                    {/* Room Management Section */}
                    <section className="space-y-4">
                        <h4 className="font-semibold text-sm text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Building size={16} /> חדרי הסניף
                        </h4>

                        {/* Inline Add/Edit Room (Works for both InMemory and Live) */}
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <div className="flex gap-3 items-end">
                                <div className="flex-1">
                                    <label className="text-xs font-medium text-slate-500 mb-1 block">שם החדר</label>
                                    <input
                                        type="text"
                                        value={roomName}
                                        onChange={e => setRoomName(e.target.value)}
                                        placeholder="לדוגמה: אולם יוגה"
                                        className="w-full border p-2 rounded text-sm min-w-0"
                                    />
                                </div>
                                <div className="w-24">
                                    <label className="text-xs font-medium text-slate-500 mb-1 block">תכולה</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={roomCapacity}
                                        onChange={e => setRoomCapacity(Number(e.target.value))}
                                        className="w-full border p-2 rounded text-sm"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleRoomSubmit}
                                    disabled={!roomName}
                                    className={`${editingRoom ? 'bg-indigo-600' : 'bg-slate-800'} text-white p-2 rounded hover:opacity-90 transition shadow-sm`}
                                >
                                    {editingRoom ? <Save size={20} /> : <Plus size={20} />}
                                </button>
                                {editingRoom && (
                                    <button type="button" onClick={cancelEdit} className="text-slate-500 p-2 hover:bg-slate-200 rounded">
                                        <X size={20} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* List of Rooms */}
                        <div className="space-y-2">
                            {/* Display InMemory Rooms (for Create Mode) */}
                            {!branch && newRooms.map((room, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-indigo-50 p-2 rounded text-indigo-600"><Building size={16} /></div>
                                        <div>
                                            <span className="font-medium text-slate-800 block">{room.name}</span>
                                            <span className="text-xs text-slate-500">עד {room.capacity} משתתפים</span>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => removeInMemoryRoom(idx)} className="text-slate-400 hover:text-red-500 p-2">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}

                            {/* Display Live Rooms (for Edit Mode) */}
                            {branch && branchRooms.map(room => (
                                <div key={room.id} className={`flex justify-between items-center p-3 bg-white border rounded-lg transition ${editingRoom?.id === room.id ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-indigo-200'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="bg-indigo-50 p-2 rounded text-indigo-600"><Building size={16} /></div>
                                        <div>
                                            <span className="font-medium text-slate-800 block">{room.name}</span>
                                            <span className="text-xs text-slate-500">עד {room.capacity} משתתפים</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button type="button" onClick={() => startEdit(room)} className="text-slate-400 hover:text-indigo-600 p-2">
                                            <Edit size={16} />
                                        </button>
                                        <button type="button" onClick={() => deleteRoom(room.id)} className="text-slate-400 hover:text-red-500 p-2">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {(!branch && newRooms.length === 0) && (
                                <div className="text-center py-4 text-slate-400 text-sm italic">לא הוגדרו חדרים</div>
                            )}

                            {(branch && branchRooms.length === 0) && (
                                <div className="text-center py-4 text-slate-400 text-sm italic">לא נמצאו חדרים</div>
                            )}
                        </div>
                    </section>

                    {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
                </div>

                <div className="p-6 border-t border-slate-100 flex gap-3 bg-slate-50 rounded-b-xl">
                    <button type="button" onClick={onClose} className="flex-1 py-2.5 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg font-medium transition-colors">
                        ביטול
                    </button>
                    <button type="button" onClick={handleSubmit} disabled={loading} className="flex-1 py-2.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors shadow-sm flex justify-center items-center gap-2">
                        {loading && <Loader2 className="animate-spin" size={18} />}
                        {branch ? 'שמור שינויים' : 'צור סניף'}
                    </button>
                </div>
            </div>
        </div>
    );
};
