import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  MoreHorizontal,
  ChevronLeft,
  Loader2,
  X,
  Save,
  DollarSign,
  Edit,
  Trash2
} from "lucide-react";
import { CourseService, UserService, BranchService, RoomService } from "../../services/api";
import { ClassSession, User, Branch, Room } from "../../types/types";

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

const DAYS = Object.values(DAY_MAP);

// --- Add Class Modal ---
interface AddClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newClass: any) => void;
  editClass?: ClassSession | null;
}

const AddClassModal: React.FC<AddClassModalProps> = ({ isOpen, onClose, onSuccess, editClass }) => {
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const newClassPayload = {
        name: formData.name,
        instructor_id: formData.instructor_id,
        branch_id: formData.branch_id,
        day_of_week: Number(formData.day_of_week) as any, // Cast to any to bypass strict literal check or use strict type logic
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

      // Construct the view object locally to avoid refetch
      const instructorObj = instructors.find(i => i.id === formData.instructor_id);

      // We need to return an object structure that matches what formatClassForDisplay expects
      // OR what the raw data looks like coming from the server + the joins we know
      const hydratedClass = {
        ...result,
        instructor: { full_name: instructorObj?.full_name || 'לא ידוע' }
      };

      onSuccess(hydratedClass);
      onClose();
      // איפוס חלקי לטופס
      setFormData(prev => ({ ...prev, name: '', price_ils: 0 }));

    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || err.message || "שגיאה ביצירת השיעור");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-right">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]">
        <div className="bg-indigo-600 p-6 flex justify-between items-center text-white shrink-0">
          <h3 className="text-xl font-bold">{editClass ? 'עריכת פרטי שיעור' : 'שיבוץ שיעור חדש'}</h3>
          <button onClick={onClose} className="hover:bg-indigo-500 p-1 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">שם השיעור</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="לדוגמה: יוגה מתחילים"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">סניף</label>
              <select
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                value={formData.branch_id}
                onChange={e => setFormData({ ...formData, branch_id: e.target.value })}
              >
                <option value="" disabled>בחר סניף</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">מדריך</label>
              <select
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                value={formData.instructor_id}
                onChange={e => setFormData({ ...formData, instructor_id: e.target.value })}
              >
                <option value="" disabled>בחר מדריך</option>
                {instructors.map(inst => (
                  <option key={inst.id} value={inst.id}>{inst.full_name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">יום בשבוע</label>
              <select
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                value={formData.day_of_week}
                onChange={e => setFormData({ ...formData, day_of_week: Number(e.target.value) })}
              >
                {Object.entries(DAY_MAP).map(([key, val]) => (
                  <option key={key} value={key}>{val}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">חדר</label>
              <select
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
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
              >
                <option value="" disabled>בחר חדר</option>
                {availableRooms.length > 0 ? (
                  availableRooms.map(room => (
                    <option key={room.id} value={room.name}>{room.name}</option>
                  ))
                ) : (
                  <option value="אולם ראשי">אולם ראשי (ברירת מחדל)</option>
                )}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">שעת התחלה</label>
              <input
                type="time"
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.start_time}
                onChange={e => setFormData({ ...formData, start_time: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">שעת סיום</label>
              <input
                type="time"
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.end_time}
                onChange={e => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">רמה</label>
              <select
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                value={formData.level}
                onChange={e => setFormData({ ...formData, level: e.target.value as any })}
              >
                <option value="ALL_LEVELS">כל הרמות</option>
                <option value="BEGINNER">מתחילים</option>
                <option value="INTERMEDIATE">בינוניים</option>
                <option value="ADVANCED">מתקדמים</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">מכסה מקסימלית</label>
              <input
                type="number"
                min="1"
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.max_capacity}
                onChange={e => setFormData({ ...formData, max_capacity: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">מחיר (₪)</label>
              <div className="relative">
                <DollarSign className="absolute right-3 top-2.5 text-slate-400" size={16} />
                <input
                  type="number"
                  min="0"
                  required
                  className="w-full pr-10 pl-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.price_ils}
                  onChange={e => setFormData({ ...formData, price_ils: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>}

          <div className="pt-4 flex gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {editClass ? 'שמור שינויים' : 'שמור שיעור'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Main Component ---

export const ClassSchedule: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState("ראשון");
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassSession | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const formatClassForDisplay = (cls: any) => {
    // Calculate duration
    const today = "1970-01-01";
    const start = new Date(`${today}T${cls.start_time}`);
    const end = new Date(`${today}T${cls.end_time}`);
    const duration = (end.getTime() - start.getTime()) / 60000;

    return {
      id: cls.id,
      name: cls.name,
      instructor: cls.instructor?.full_name || 'לא ידוע',
      instructorAvatar: cls.instructor?.full_name
        ? cls.instructor.full_name.substring(0, 2).toUpperCase()
        : '?',
      startTime: cls.start_time.substring(0, 5),
      duration: duration,
      dayOfWeek: DAY_MAP[cls.day_of_week] || "ראשון",
      students: cls.current_enrollment || 0,
      capacity: cls.max_capacity,
      level: cls.level,
      room: cls.location_room || 'אולם ראשי',
      category: 'כללי',
      color: 'indigo',
      // Raw fields for editing
      original: cls
    };
  };

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const data = await CourseService.getAll({ status: 'active' });

      if (data) {
        const formattedClasses = data.map(formatClassForDisplay);
        setClasses(formattedClasses);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const filteredClasses = classes
    .filter((c) => c.dayOfWeek === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const getEndTime = (startTime: string, duration: number) => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    date.setMinutes(date.getMinutes() + duration);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  };

  const getLevelBadgeColor = (level: string) => {
    const normalizedLevel = level?.toUpperCase();
    switch (normalizedLevel) {
      case "BEGINNER": return "bg-green-100 text-green-700";
      case "INTERMEDIATE": return "bg-blue-100 text-blue-700";
      case "ADVANCED": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const translateLevel = (level: string) => {
    const map: Record<string, string> = {
      'BEGINNER': 'מתחילים',
      'INTERMEDIATE': 'בינוניים',
      'ADVANCED': 'מתקדמים',
      'ALL_LEVELS': 'כל הרמות'
    };
    return map[level?.toUpperCase()] || level;
  }

  const getColorClasses = (color: string) => {
    return "bg-indigo-500";
  };


  const handleEdit = (classItem: any) => {
    setEditingClass(classItem.original);
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (!confirm('האם להסיר את השיעור מהמערכת?')) return;

    try {
      await CourseService.delete(id);
      fetchClasses();
    } catch (err) {
      console.error("Failed to delete class", err);
      alert('שגיאה במחיקת השיעור');
    }
    setActiveMenuId(null);
  };

  return (
    <div className="space-y-6">
      <AddClassModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingClass(null); }}
        onSuccess={(newClassRaw) => {
          const formatted = formatClassForDisplay(newClassRaw);
          setClasses(prev => {
            const exists = prev.some(c => c.id === formatted.id);
            if (exists) {
              return prev.map(c => c.id === formatted.id ? formatted : c);
            }
            return [...prev, formatted];
          });
        }}
        editClass={editingClass}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="text-indigo-600" />
            מערכת שעות
          </h2>
          <p className="text-slate-500">ניהול השיעורים השבועי שלך</p>
        </div>
        <button
          onClick={() => { setEditingClass(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
        >
          <Plus size={16} />
          שיבוץ שיעור חדש
        </button>
      </div>

      {/* Day Tabs */}
      <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-100 flex overflow-x-auto">
        {DAYS.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${selectedDay === day
              ? "bg-indigo-50 text-indigo-700 shadow-sm"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Schedule List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-slate-400">
            <Loader2 className="animate-spin mr-2" /> טוען מערכת שעות...
          </div>
        ) : filteredClasses.length > 0 ? (
          filteredClasses.map((session) => (
            <div
              key={session.id}
              className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow group relative"
            >
              {/* Color Stripe */}
              <div className={`absolute right-0 top-0 bottom-0 w-1.5 rounded-r-xl ${getColorClasses(session.color)}`}></div>

              <div className="flex flex-col md:flex-row md:items-center gap-6 pr-2">
                {/* Time & Duration */}
                <div className="flex-shrink-0 min-w-[140px]">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
                    <Clock size={20} className="text-slate-400" />
                    {session.startTime}{" "}
                    <span className="text-slate-400 font-normal text-sm">
                      - {getEndTime(session.startTime, session.duration)}
                    </span>
                  </div>
                  <div className="text-slate-500 text-sm mt-1 mr-7">
                    {session.duration} דקות
                  </div>
                </div>

                {/* Class Info */}
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold text-slate-800">
                      {session.name}
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getLevelBadgeColor(
                        session.level
                      )}`}
                    >
                      {translateLevel(session.level)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                        {session.instructorAvatar}
                      </div>
                      {session.instructor}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={14} />
                      {session.room}
                    </div>
                  </div>
                </div>

                {/* Capacity & Actions */}
                <div className="flex-shrink-0 flex items-center gap-6 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="flex flex-col gap-1 w-full md:w-32">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-600 flex items-center gap-1">
                        <Users size={12} /> רשומים
                      </span>
                      <span
                        className={
                          session.students >= session.capacity
                            ? "text-red-500"
                            : "text-slate-900"
                        }
                      >
                        {session.students}/{session.capacity}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${session.students >= session.capacity
                          ? "bg-red-500"
                          : "bg-indigo-500"
                          }`}
                        style={{
                          width: `${(session.students / session.capacity) * 100
                            }%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === session.id ? null : session.id);
                      }}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-full transition-colors mr-auto md:mr-0 relative z-10"
                    >
                      <MoreHorizontal size={20} />
                    </button>

                    {/* Dropdown Menu */}
                    {activeMenuId === session.id && (
                      <div className="absolute left-0 bottom-full mb-2 w-32 bg-white rounded-lg shadow-xl border border-slate-100 py-1 z-50 animate-fadeIn origin-bottom-left">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEdit(session); }}
                          className="w-full text-right px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Edit size={14} /> ערוך
                        </button>
                        <button
                          onClick={(e) => handleDelete(session.id, e)}
                          className="w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 size={14} /> מחק
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200">
            <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">
              אין שיעורים מתוכננים
            </h3>
            <p className="text-slate-500 mt-1 mb-6">
              לא נמצאו שיעורים ביום {selectedDay}.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700"
            >
              הוסף שיעור ליום {selectedDay} <ChevronLeft size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};