import React, { useState } from 'react';
import { Branch, Room } from '../../../../types/types';
import { BranchService } from '../../../../services/api';
import { BranchModal } from '../../BranchModal';
import { Plus, MapPin, Edit, Trash2, Building } from 'lucide-react';

interface BranchManagementTabProps {
    branches: Branch[];
    rooms: Room[];
    onRefresh: () => void;
}

export const BranchManagementTab: React.FC<BranchManagementTabProps> = ({ branches, rooms, onRefresh }) => {
    const [isbranchModalOpen, setIsBranchModalOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [error, setError] = useState<string | null>(null);

    const openBranchModal = (branch?: Branch) => {
        setEditingBranch(branch || null);
        setIsBranchModalOpen(true);
    };

    const handleDeleteBranch = async (id: string) => {
        if (!confirm('האם אתה בטוח שברצונך למחוק סניף זה?')) return;
        try {
            await BranchService.delete(id);
            onRefresh();
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg">ניהול סניפים</h3>
                <button onClick={() => openBranchModal()} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-indigo-700">
                    <Plus size={16} /> הוסף סניף
                </button>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">{error}</div>}

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
                onSuccess={onRefresh}
                branch={editingBranch}
                existingRooms={rooms}
            />
        </div>
    );
};
