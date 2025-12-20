import React, { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import { CourseService, UserService, BranchService, RoomService } from "../../services/api";
import { ClassSession, User, Branch, Room } from "../../types/types";
import { BaseModal } from "../common/BaseModal";
import { FormInput, FormSelect } from "../common/FormFields";

// --- Constants ---
const DAY_MAP: Record<number, string> = {
    0: "ראשון",
    1: "שני",
    2: "שלישי",
    3: "רביעי",
    4: "חמישי",
    5: "שישי",
    6: "שבת"
};

interface AddClassModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newClass: any) => void;
    editClass?: ClassSession | null;
}

export const AddClassModal: React.FC<AddClassModalProps> = ({ isOpen, onClose, onSuccess, editClass }) => {
    const [loading, setLoading] = useState(false);
    const [instructors, setInstructors] = useState<User[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [allRooms, setAllRooms] = useState<Room[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        instructor_id: '',
        branch_id: '',
        day_of_week: 0,
        start_time: '09:00',
        end_time: '10:00',
        max_capacity: 20,
        level: 'ALL_LEVELS' as const,
        price_ils: 0,
        location_room: 'אולם ראשי'
    });

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                try {
                    const [instructorsData, branchesData, roomsData] = await Promise.all([
                        UserService.getInstructors(),
                        BranchService.getAll(),
                        RoomService.getAll()
                    ]);

                    setInstructors(instructorsData);
                    setBranches(branchesData);
                    setAllRooms(roomsData);

                    // Default selection logic
                    setFormData(prev => {
                        const newData = { ...prev };
                        if (instructorsData.length > 0 && !prev.instructor_id) {
                            newData.instructor_id = instructorsData[0].id;
                        }
                        if (branchesData.length > 0 && !prev.branch_id) {
                            const defaultBranchId = branchesData[0].id;
                            newData.branch_id = defaultBranchId;

                            // Auto-select room for default branch
                            const defaultBranchRooms = roomsData.filter(r => r.branch_id === defaultBranchId);
                            if (defaultBranchRooms.length > 0) {
                                newData.location_room = defaultBranchRooms[0].name;
                            }
                        }
                        return newData;
                    });
                } catch (err) {
                    console.error("Error fetching form data:", err);
                }
            };
            fetchData();
        }
    }, [isOpen]);

    // Pre-fill form when editClass changes
    useEffect(() => {
        if (isOpen && editClass) {
            setFormData({
                name: editClass.name,
                instructor_id: editClass.instructor_id || '',
                branch_id: editClass.branch_id || '',
                day_of_week: editClass.day_of_week,
                start_time: editClass.start_time,
                end_time: editClass.end_time,
                max_capacity: editClass.max_capacity,
                level: editClass.level,
                price_ils: editClass.price_ils || 0,
                location_room: editClass.location_room || 'אולם ראשי'
            });
        } else if (isOpen && !editClass) {
            // Reset for create mode
            setFormData(prev => ({
                ...prev,
                name: '',
                price_ils: 0,
                start_time: '09:00',
                end_time: '10:00'
            }));
        }
    }, [isOpen, editClass]);

    // Derived state: Filter rooms based on selected branch
    const availableRooms = allRooms.filter(r => r.branch_id === formData.branch_id);

    // Create options for selects
    const branchOptions = branches.map(b => ({ value: b.id, label: b.name }));
    const instructorOptions = instructors.map(i => ({ value: i.id, label: i.full_name }));
    const dayOptions = Object.entries(DAY_MAP).map(([key, val]) => ({ value: key, label: val }));
    const roomOptions = availableRooms.length > 0
        ? availableRooms.map(r => ({ value: r.name, label: r.name }))
        : [{ value: 'אולם ראשי', label: 'אולם ראשי (ברירת מחדל)' }];

    const levelOptions = [
        { value: "ALL_LEVELS", label: "כל הרמות" },
        { value: "BEGINNER", label: "מתחילים" },
        { value: "INTERMEDIATE", label: "בינוניים" },
        { value: "ADVANCED", label: "מתקדמים" },
    ];

    // Auto-select room when branch changes (client-side only)
    useEffect(() => {
        if (formData.branch_id && availableRooms.length > 0) {
            // Check if current room is valid for this branch, if not, switch to first available
            const isCurrentRoomValid = availableRooms.some(r => r.name === formData.location_room);
            if (!isCurrentRoomValid) {
                setFormData(prev => ({ ...prev, location_room: availableRooms[0].name }));
            }
        }
    }, [formData.branch_id, allRooms]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const newClassPayload = {
                name: formData.name,
                instructor_id: formData.instructor_id,
                branch_id: formData.branch_id,
                day_of_week: Number(formData.day_of_week) as any,
                start_time: formData.start_time,
                end_time: formData.end_time,
                max_capacity: Number(formData.max_capacity),
                level: formData.level,
                price_ils: Number(formData.price_ils),
                location_room: formData.location_room,
                is_active: true
            };

            let result;
            if (editClass) {
                result = await CourseService.update(editClass.id, newClassPayload);
            } else {
                result = await CourseService.create(newClassPayload);
            }

            const instructorObj = instructors.find(i => i.id === formData.instructor_id);
            const hydratedClass = {
                ...result,
                instructor: { full_name: instructorObj?.full_name || 'לא ידוע' }
            };

            onSuccess(hydratedClass);
            onClose();
            setFormData(prev => ({ ...prev, name: '', price_ils: 0 }));

        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || err.message || "שגיאה ביצירת השיעור");
        } finally {
            setLoading(false);
        }
    };

    const Footer = (
        <>
            <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
            >
                ביטול
            </button>
            <button
                // Trigger form submit via id or ref effectively? 
                // Since this is outside the form, we need to associate it or wrap form inside BaseModal content better.
                // Refactor strategy: Put <form> as direct child of modal content, 
                // OR make 'handleSubmit' triggerable. 
                // Easiest for now: Use the form id="addClassForm" and button form="addClassForm"
                form="addClassForm"
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {editClass ? 'שמור שינויים' : 'שמור שיעור'}
            </button>
        </>
    );

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title={editClass ? 'עריכת פרטי שיעור' : 'שיבוץ שיעור חדש'}
            footer={Footer}
        >
            <form id="addClassForm" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                        label="שם השיעור"
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="לדוגמה: יוגה מתחילים"
                    />

                    <FormSelect
                        label="סניף"
                        required
                        options={branchOptions}
                        value={formData.branch_id}
                        onChange={e => setFormData({ ...formData, branch_id: e.target.value })}
                        placeholder="בחר סניף"
                    />

                    <FormSelect
                        label="מדריך"
                        required
                        options={instructorOptions}
                        value={formData.instructor_id}
                        onChange={e => setFormData({ ...formData, instructor_id: e.target.value })}
                        placeholder="בחר מדריך"
                    />

                    <FormSelect
                        label="יום בשבוע"
                        options={dayOptions}
                        value={formData.day_of_week}
                        onChange={e => setFormData({ ...formData, day_of_week: Number(e.target.value) })}
                    />

                    <FormSelect
                        label="חדר"
                        options={roomOptions}
                        value={formData.location_room}
                        onChange={e => {
                            const selectedName = e.target.value;
                            const roomObj = availableRooms.find(r => r.name === selectedName);
                            setFormData({
                                ...formData,
                                location_room: selectedName,
                                max_capacity: roomObj ? (roomObj.capacity || 20) : formData.max_capacity
                            });
                        }}
                        placeholder="בחר חדר"
                    />

                    <FormInput
                        label="שעת התחלה"
                        type="time"
                        required
                        value={formData.start_time}
                        onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                    />

                    <FormInput
                        label="שעת סיום"
                        type="time"
                        required
                        value={formData.end_time}
                        onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                    />

                    <FormSelect
                        label="רמה"
                        options={levelOptions}
                        value={formData.level}
                        onChange={e => setFormData({ ...formData, level: e.target.value as any })}
                    />

                    <FormInput
                        label="מכסה מקסימלית"
                        type="number"
                        min="1"
                        required
                        value={formData.max_capacity}
                        onChange={e => setFormData({ ...formData, max_capacity: Number(e.target.value) })}
                    />

                    <FormInput
                        label="מחיר (₪)"
                        type="number"
                        min="0"
                        required
                        value={formData.price_ils}
                        onChange={e => setFormData({ ...formData, price_ils: Number(e.target.value) })}
                    />
                </div>

                {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>}
            </form>
        </BaseModal>
    );
};
