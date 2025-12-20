import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { CourseService } from "../../services/api";
import { ClassSession } from "../../types/types";
import { AddClassModal } from "./AddClassModal";
import { ClassCard } from "../common/ClassCard";

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

// --- Main Component ---

export const ClassSchedule: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState("ראשון");
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassSession | null>(null);

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

  const handleEdit = (classItem: any) => {
    setEditingClass(classItem.original);
    setIsModalOpen(true);
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
            <ClassCard
              key={session.id}
              session={session}
              isAdmin={true}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
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