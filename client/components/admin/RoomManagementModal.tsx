import React, { useState, useEffect } from 'react';
import { Branch, Room } from '../../types/types';
import { RoomService } from '../../services/api';
import { X, Plus, Trash2, MapPin, Warehouse, Edit, Save } from 'lucide-react';

interface RoomManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    branch: Branch | null;
}

export const RoomManagementModal: React.FC<RoomManagementModalProps> = ({ isOpen, onClose, branch }) => {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(false);
    const [newName, setNewName] = useState('');
    const [newCapacity, setNewCapacity] = useState<number>(20);
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && branch) {
            fetchRooms();
        }
    }, [isOpen, branch]);

    const fetchRooms = async () => {
        if (!branch) return;
        setLoading(true);
        try {
            const data = await RoomService.getByBranch(branch.id);
            setRooms(data);
        } catch (err) {
            console.error('Failed to load rooms', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!branch) return;

        try {
            if (editingRoom) {
                await RoomService.update(editingRoom.id, {
                    name: newName,
                    capacity: newCapacity
                });
                setEditingRoom(null);
            } else {
                await RoomService.create({
                    branch_id: branch.id,
                    name: newName,
                    capacity: newCapacity,
                    is_active: true
                });
            }

            setNewName('');
            setNewCapacity(20);
            fetchRooms();
        } catch (err: any) {
            setError(err.message || 'Error processing room');
        }
    };

    const startEdit = (room: Room) => {
        setEditingRoom(room);
        setNewName(room.name);
        setNewCapacity(room.capacity || 20);
        setError(null);
    };

    const cancelEdit = () => {
        setEditingRoom(null);
        setNewName('');
        setNewCapacity(20);
        setError(null);
    };

    const handleDeleteRoom = async (roomId: string) => {
        if (!confirm('האם למחוק את החדר?')) return;
        try {
            await RoomService.delete(roomId);
            fetchRooms();
        } catch (err: any) {
            setError(err.message || 'Error deleting room');
        }
    };

    if (!isOpen || !branch) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-fadeIn flex flex-col max-h-[85vh]">
                <div className="bg-indigo-600 p-5 flex justify-between items-center text-white shrink-0">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2"><Warehouse size={20} /> ניהול חדרים</h3>
                        <p className="text-indigo-100 text-sm flex items-center gap-1"><MapPin size={12} /> {branch.name}</p>
                    </div>
                    <button onClick={onClose} className="hover:bg-indigo-500 p-1 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-6">

                    {/* Add/Edit Room Form */}
                    <form onSubmit={handleSubmit} className={`p-4 rounded-lg border ${editingRoom ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex justify-between items-center mb-3">
                            <h4 className={`font-semibold text-sm ${editingRoom ? 'text-indigo-800' : 'text-slate-700'}`}>
                                {editingRoom ? 'עריכת חדר' : 'הוסף חדר חדש'}
                            </h4>
                            {editingRoom && (
                                <button type="button" onClick={cancelEdit} className="text-xs text-slate-500 hover:text-slate-700">
                                    ביטול
                                </button>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                required
                                className="flex-1 border p-2 rounded text-sm min-w-0"
                                placeholder="שם החדר (לדוגמה: סטודיו A)"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                            />
                            <input
                                type="number"
                                required
                                min="1"
                                className="w-20 border p-2 rounded text-sm"
                                placeholder="מכסה"
                                value={newCapacity}
                                onChange={e => setNewCapacity(Number(e.target.value))}
                            />
                            <button type="submit" className={`${editingRoom ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-800 hover:bg-slate-900'} text-white p-2 rounded shrink-0`}>
                                {editingRoom ? <Save size={20} /> : <Plus size={20} />}
                            </button>
                        </div>
                        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                    </form>

                    {/* Rooms List */}
                    <div>
                        <h4 className="font-bold text-slate-800 mb-3">רשימת חדרים</h4>
                        {loading ? (
                            <div className="text-center py-4 text-slate-500">טוען...</div>
                        ) : rooms.length === 0 ? (
                            <div className="text-center py-6 text-slate-400 bg-slate-50 rounded border border-dashed text-sm">
                                עדיין אין חדרים בסניף זה.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {rooms.map(room => (
                                    <div key={room.id} className={`flex justify-between items-center p-3 bg-white border rounded-lg transition ${editingRoom?.id === room.id ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-indigo-200'}`}>
                                        <div>
                                            <span className="font-semibold text-slate-800 block">{room.name}</span>
                                            <span className="text-xs text-slate-500">קיבולת: {room.capacity}</span>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => startEdit(room)} className="text-slate-400 hover:text-indigo-600 p-2">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteRoom(room.id)} className="text-slate-400 hover:text-red-500 p-2">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
