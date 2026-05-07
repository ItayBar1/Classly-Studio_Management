import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { CourseService, BranchService, RoomService } from "../../services/api";
import { ClassSession, Branch, Room } from "../../types/types";
import { AddClassModal } from "./AddClassModal";
import { ClassCard } from "../common/ClassCard";
import { DAY_MAP, DAYS_ARRAY, extractTime } from "../../utils/dateUtils";

// --- Main Component ---

export const ClassSchedule: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState("ראשון");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassSession | null>(null);

  const formatClassForDisplay = (cls: any) => {
    const startTimeStr = extractTime(cls.start_time);
    const endTimeStr = extractTime(cls.end_time);

    // Calculate duration in minutes
    const start = new Date(`1970-01-01T${startTimeStr}:00.000Z`);
    const end = new Date(`1970-01-01T${endTimeStr}:00.000Z`);
    const duration = Math.round((end.getTime() - start.getTime()) / 60000);

    return {
      id: cls.id,
      name: cls.name,
      instructor: cls.instructor?.full_name || "לא ידוע",
      instructorAvatar: cls.instructor?.full_name
        ? cls.instructor.full_name.substring(0, 2).toUpperCase()
        : "?",
      startTime: startTimeStr,
      duration: duration,
      dayOfWeek: DAY_MAP[cls.day_of_week] || "ראשון",
      students: cls.current_enrollment || 0,
      capacity: cls.max_capacity,
      level: cls.level,
      room: cls.location_room || "אולם ראשי",
      category: "כללי",
      color: "indigo",
      branch_id: cls.branch_id,
      // Raw fields for editing
      original: cls,
    };
  };

  const fetchClassesAndBranches = async () => {
    try {
      setLoading(true);
      const [coursesData, branchesData, roomsData] = await Promise.all([
        CourseService.getAll({ status: "active" }),
        BranchService.getAll(),
        RoomService.getAll(),
      ]);

      if (branchesData && branchesData.length > 0) {
        setBranches(branchesData);
        if (!selectedBranchId) {
          setSelectedBranchId(branchesData[0].id);
        }
      }

      if (roomsData) {
        setAllRooms(roomsData);
      }

      if (coursesData) {
        const formattedClasses = coursesData.map(formatClassForDisplay);
        setClasses(formattedClasses);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassesAndBranches();
  }, []);

  const filteredClasses = classes
    .filter((cls) => cls.dayOfWeek === selectedDay && (!selectedBranchId || cls.branch_id === selectedBranchId))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const branchRooms = allRooms.filter(room => room.branch_id === selectedBranchId);

  const columns = branchRooms.map(room => ({
    id: room.id,
    name: room.name,
    classes: filteredClasses.filter(cls => cls.room === room.name)
  }));



  const handleEdit = (classItem: any) => {
    setEditingClass(classItem.original);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      await CourseService.delete(id);
      fetchClassesAndBranches();
    } catch (err) {
      console.error("Failed to delete class", err);
      alert("שגיאה במחיקת השיעור");
    }
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>לוח שיעורים | Classly</title>
      </Helmet>
      <AddClassModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingClass(null);
        }}
        onSuccess={(newClassRaw) => {
          const formatted = formatClassForDisplay(newClassRaw);
          setClasses((prev) => {
            const exists = prev.some((cls) => cls.id === formatted.id);
            if (exists) {
              return prev.map((cls) => (cls.id === formatted.id ? formatted : cls));
            }
            return [...prev, formatted];
          });
        }}
        editClass={editingClass}
        defaultDay={DAYS_ARRAY.indexOf(selectedDay)}
        defaultBranchId={selectedBranchId || undefined}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 dark:text-slate-100">
            <Calendar className="text-indigo-600 dark:text-indigo-500" />
            מערכת שעות
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            ניהול השיעורים השבועי שלך
          </p>
        </div>
        <button
          onClick={() => {
            setEditingClass(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
        >
          <Plus size={16} />
          שיבוץ שיעור חדש
        </button>
      </div>

      {/* Branch Tabs */}
      {branches.length > 0 && (
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto scrollbar-hide">
          {branches.map((branch) => (
            <button
              key={branch.id}
              onClick={() => setSelectedBranchId(branch.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                selectedBranchId === branch.id
                  ? "border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:border-slate-700"
              }`}
            >
              {branch.name}
            </button>
          ))}
        </div>
      )}

      {/* Day Tabs */}
      <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-100 flex overflow-x-auto gap-1 scrollbar-hide dark:bg-slate-900 dark:border-slate-800/10">
        {DAYS_ARRAY.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`flex-shrink-0 md:flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              selectedDay === day
                ? "bg-indigo-50 text-indigo-700 shadow-sm dark:bg-indigo-600 dark:text-white"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200"
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Schedule Grid */}
      <div className="w-full">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-slate-400">
            <Loader2 className="animate-spin mr-2" /> טוען מערכת שעות...
          </div>
        ) : filteredClasses.length > 0 || columns.length > 0 ? (
          <div className="flex overflow-x-auto gap-4 pb-4 snap-x w-full scrollbar-hide">
            {columns.map(col => (
              <div key={col.id} className="flex-none w-full sm:w-[320px] lg:flex-1 lg:min-w-[300px] snap-center">
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-t-xl border border-b-0 border-slate-200 dark:border-slate-700">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2">
                    <MapPin size={16} className="text-indigo-500" />
                    {col.name}
                    <span className="text-xs bg-white dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-500 shadow-sm">
                      {col.classes.length}
                    </span>
                  </h3>
                </div>
                <div className="bg-slate-50/50 dark:bg-slate-800/50 p-3 rounded-b-xl border border-slate-200 dark:border-slate-700 space-y-3 min-h-[300px]">
                  {col.classes.length > 0 ? (
                    col.classes.map(session => (
                      <ClassCard
                        key={session.id}
                        session={session}
                        isAdmin={true}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-slate-400">
                      <Calendar className="h-8 w-8 mb-2 opacity-20" />
                      <span className="text-sm">אין שיעורים</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200 dark:bg-slate-900/50 dark:border-slate-700">
            <Calendar className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
              אין שיעורים מתוכננים
            </h3>
            <p className="text-slate-500 mt-1 mb-6 dark:text-slate-400">
              לא נמצאו שיעורים ביום {selectedDay}.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              הוסף שיעור ליום {selectedDay} <ChevronLeft size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
