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
  DollarSign
} from "lucide-react";
import { supabase } from '../services/supabaseClient';
import { ClassSession } from "../types/types";
import { Database } from '../types/database';

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

// --- Type Definitions ---
type ClassLevel = Database['public']['Tables']['classes']['Row']['level'];

// אינטרפייסים מקומיים לעבודה נוחה
interface Instructor {
  id: string;
  full_name: string | null;
}

interface UserWithStudio {
  studio_id: string | null;
}

// --- Add Class Modal ---
interface AddClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  studioId?: string; 
}

const AddClassModal: React.FC<AddClassModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  
  // State עם טיפוס מוגדר
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    instructor_id: '',
    day_of_week: 0,
    start_time: '09:00',
    end_time: '10:00',
    max_capacity: 20,
    level: 'ALL_LEVELS' as ClassLevel,
    price_ils: 0,
    location_room: 'אולם ראשי'
  });
  
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchInstructors = async () => {
        const { data } = await supabase
          .from('users')
          .select('id, full_name')
          .eq('role', 'INSTRUCTOR');
        
        if (data) {
          const typedInstructors = data as Instructor[];
          setInstructors(typedInstructors);
          
          if (typedInstructors.length > 0 && !formData.instructor_id) {
            setFormData(prev => ({ ...prev, instructor_id: typedInstructors[0].id }));
          }
        }
      };
      fetchInstructors();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data } = await supabase
        .from('users')
        .select('studio_id')
        .eq('id', user.id)
        .single();
        
      const userData = data as UserWithStudio | null;
      
      if (!userData || !userData.studio_id) {
        throw new Error("לא נמצא סטודיו משויך למשתמש");
      }
      
      const studioId = userData.studio_id;

      // הכנת האובייקט
      const newClassPayload = {
        studio_id: studioId,
        name: formData.name,
        instructor_id: formData.instructor_id,
        day_of_week: Number(formData.day_of_week),
        start_time: formData.start_time,
        end_time: formData.end_time,
        max_capacity: Number(formData.max_capacity),
        level: formData.level,
        price_ils: Number(formData.price_ils),
        location_room: formData.location_room,
        is_active: true
      };

      // --- התיקון הסופי ---
      // אנו מבצעים Casting ל-Builder עצמו ל-any.
      // זה עוקף את הבדיקה של TypeScript שחושבת בטעות שהטבלה לא תומכת ב-Insert (type 'never').
      const { error: insertError } = await (supabase.from('classes') as any)
        .insert([newClassPayload]);

      if (insertError) throw insertError;

      onSuccess();
      onClose();
      setFormData(prev => ({ ...prev, name: '', price_ils: 0 }));

    } catch (err: any) {
      console.error(err);
      setError(err.message || "שגיאה ביצירת השיעור");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-right">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]">
        <div className="bg-indigo-600 p-6 flex justify-between items-center text-white shrink-0">
          <h3 className="text-xl font-bold">שיבוץ שיעור חדש</h3>
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
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="לדוגמה: יוגה מתחילים"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">מדריך</label>
              <select
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                value={formData.instructor_id}
                onChange={e => setFormData({...formData, instructor_id: e.target.value})}
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
                onChange={e => setFormData({...formData, day_of_week: Number(e.target.value)})}
              >
                {Object.entries(DAY_MAP).map(([key, val]) => (
                  <option key={key} value={key}>{val}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">מיקום / חדר</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.location_room}
                onChange={e => setFormData({...formData, location_room: e.target.value})}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">שעת התחלה</label>
              <input
                type="time"
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.start_time}
                onChange={e => setFormData({...formData, start_time: e.target.value})}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">שעת סיום</label>
              <input
                type="time"
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.end_time}
                onChange={e => setFormData({...formData, end_time: e.target.value})}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">רמה</label>
              <select
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                value={formData.level || 'ALL_LEVELS'}
                onChange={e => setFormData({...formData, level: e.target.value as ClassLevel})}
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
                onChange={e => setFormData({...formData, max_capacity: Number(e.target.value)})}
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
                  onChange={e => setFormData({...formData, price_ils: Number(e.target.value)})}
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
              שמור שיעור
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
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          instructor:users!instructor_id (
            full_name,
            profile_image_url
          )
        `)
        .eq('is_active', true);

      if (error) throw error;

      if (data) {
        const formattedClasses: ClassSession[] = data.map((cls: any) => {
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
              ? cls.instructor.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() 
              : '?',
            startTime: cls.start_time.substring(0, 5),
            duration: duration,
            dayOfWeek: DAY_MAP[cls.day_of_week] || "ראשון",
            students: cls.current_enrollment || 0,
            capacity: cls.max_capacity,
            level: cls.level, 
            room: cls.location_room || 'אולם ראשי',
            category: 'כללי', 
            color: 'indigo' 
          };
        });
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

  return (
    <div className="space-y-6">
      <AddClassModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchClasses()}
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
          onClick={() => setIsModalOpen(true)}
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
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              selectedDay === day
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
              className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow group relative overflow-hidden"
            >
              {/* Color Stripe */}
              <div className={`absolute right-0 top-0 bottom-0 w-1.5 ${getColorClasses(session.color)}`}></div>

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
                        className={`h-2 rounded-full ${
                          session.students >= session.capacity
                            ? "bg-red-500"
                            : "bg-indigo-500"
                        }`}
                        style={{
                          width: `${
                            (session.students / session.capacity) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-full transition-colors mr-auto md:mr-0">
                    <MoreHorizontal size={20} />
                  </button>
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