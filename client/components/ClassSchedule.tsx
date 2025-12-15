import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  MoreHorizontal,
  ChevronRight,
  Loader2
} from "lucide-react";
import { supabase } from '../services/supabaseClient';
import { ClassSession } from "../types/types";

// מיפוי ימים ממספרים (DB) למחרוזות (UI)
// הערה: יש לוודא האם 0 ב-DB שלך הוא ראשון או שני. כאן הנחנו 0=Sunday
const DAY_MAP: Record<number, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday"
};

const DAYS = Object.values(DAY_MAP);

export const ClassSchedule: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState("Sunday");
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);

  // פונקציית שליפת נתונים
  const fetchClasses = async () => {
    try {
      setLoading(true);
      
      // שליפה של השיעורים + פרטי המדריך (Join)
      // אנו מניחים ש-instructor_id בטבלת classes מקושר לטבלת users
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
        // המרת הנתונים מהמבנה של ה-DB למבנה של האפליקציה
        const formattedClasses: ClassSession[] = data.map((cls: any) => {
          // חישוב משך זמן בדקות
          const start = new Date(`1970-01-01T${cls.start_time}`);
          const end = new Date(`1970-01-01T${cls.end_time}`);
          const duration = (end.getTime() - start.getTime()) / 60000; // המרה לדקות

          return {
            id: cls.id,
            name: cls.name,
            // בדיקה שה-join הצליח ושיש נתונים
            instructor: cls.instructor?.full_name || 'Unknown Instructor',
            instructorAvatar: cls.instructor?.full_name 
              ? cls.instructor.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() 
              : 'NB',
            startTime: cls.start_time.substring(0, 5), // הסרת השניות (09:00:00 -> 09:00)
            duration: duration,
            dayOfWeek: DAY_MAP[cls.day_of_week] || "Sunday",
            students: cls.current_enrollment || 0,
            capacity: cls.max_capacity,
            level: cls.level, // שים לב: ה-DB שומר ב-UPPERCASE, ה-UI מצפה ל-Capitalized. ייתכן וצריך המרה.
            room: cls.location_room || 'Main Hall',
            category: 'General', // חסר category ב-join, אפשר להוסיף אם צריך
            color: 'indigo' // ניתן להוסיף עמודת צבע לטבלת classes או categories
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

  // סינון ומיון לוקאלי (לאחר השליפה)
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
    // התאמה לערכים ב-DB שיכולים להיות ב-UPPERCASE
    const normalizedLevel = level.toUpperCase();
    switch (normalizedLevel) {
      case "BEGINNER":
        return "bg-green-100 text-green-700";
      case "INTERMEDIATE":
        return "bg-blue-100 text-blue-700";
      case "ADVANCED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getColorClasses = (color: string) => {
    const map: Record<string, string> = {
      emerald: "bg-emerald-500",
      orange: "bg-orange-500",
      purple: "bg-purple-500",
      pink: "bg-pink-500",
      blue: "bg-blue-500",
      indigo: "bg-indigo-500",
    };
    return map[color] || "bg-indigo-500";
  };

  if (loading && classes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <Loader2 className="animate-spin mr-2" /> Loading schedule...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="text-indigo-600" />
            Class Schedule
          </h2>
          <p className="text-slate-500">Manage your weekly class timetable</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg">
          <Plus size={16} />
          Schedule Class
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
        {filteredClasses.length > 0 ? (
          filteredClasses.map((session) => (
            <div
              key={session.id}
              className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow group relative overflow-hidden"
            >
              {/* Color Stripe */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-1.5 ${getColorClasses(
                  session.color
                )}`}
              ></div>

              <div className="flex flex-col md:flex-row md:items-center gap-6 pl-2">
                {/* Time & Duration */}
                <div className="flex-shrink-0 min-w-[140px]">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
                    <Clock size={20} className="text-slate-400" />
                    {session.startTime}{" "}
                    <span className="text-slate-400 font-normal text-sm">
                      - {getEndTime(session.startTime, session.duration)}
                    </span>
                  </div>
                  <div className="text-slate-500 text-sm mt-1 ml-7">
                    {session.duration} minutes
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
                      {session.level}
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
                        <Users size={12} /> Registered
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

                  <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-full transition-colors ml-auto md:ml-0">
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
              No classes scheduled
            </h3>
            <p className="text-slate-500 mt-1 mb-6">
              There are no classes scheduled for {selectedDay}.
            </p>
            <button className="inline-flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700">
              Add a class for {selectedDay} <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};