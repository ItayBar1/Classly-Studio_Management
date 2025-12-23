import React, { useState, useEffect } from "react";
import {
  Clock,
  Calendar,
  MapPin,
} from "lucide-react";

interface ClassSession {
  id: string;
  name: string;
  instructor?: string;
  instructorAvatar?: string;
  startTime: string;
  duration: number;
  students: number;
  capacity: number;
  level: string;
  room: string;
  color?: string;
  original?: any; // For editing
}

interface ClassCardProps {
  session: ClassSession;
  isAdmin?: boolean;
  onEdit?: (session: any) => void;
  onDelete?: (id: string, e: React.MouseEvent) => void;
}

export const ClassCard: React.FC<ClassCardProps> = ({
  session,
  isAdmin,
  onEdit,
  onDelete,
}) => {
  const [, setActiveMenuId] = useState<string | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const getEndTime = (startTime: string, duration: number) => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    date.setMinutes(date.getMinutes() + duration);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const getLevelBadgeColor = (level: string) => {
    const normalizedLevel = level?.toUpperCase();
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

  const translateLevel = (level: string) => {
    const map: Record<string, string> = {
      BEGINNER: "מתחילים",
      INTERMEDIATE: "בינוניים",
      ADVANCED: "מתקדמים",
      ALL_LEVELS: "כל הרמות",
    };
    return map[level?.toUpperCase()] || level;
  };

  const getColorClasses = (color: string) => "bg-indigo-500";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-all group relative overflow-hidden">
      {/* פס צבע דקורטיבי בצד */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-1.5 ${getColorClasses(
          session.color || "indigo"
        )}`}
      ></div>

      <div className="flex flex-col gap-4">
        {/* שורה עליונה: זמן, כותרת ויום */}
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            {/* הצגת היום בשבוע - חדש! */}
            <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-1">
              <Calendar size={12} />
              {/* @ts-ignore - נניח שהעברנו dayName מהאבא */}
              <span>יום {session.dayName}</span>
            </div>

            <h3 className="text-lg font-bold text-slate-800 truncate">
              {session.name}
            </h3>
            <div className="flex items-center gap-2 text-slate-500 font-semibold text-sm mt-1">
              <Clock size={14} />
              <span>{session.startTime}</span>
              <span className="text-slate-400 font-normal">
                ({session.duration} דק׳)
              </span>
            </div>
          </div>
          <span
            className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${getLevelBadgeColor(
              session.level
            )}`}
          >
            {translateLevel(session.level)}
          </span>
        </div>

        {/* שורת אמצע: מיקום ומדריך */}
        <div className="grid grid-cols-2 gap-2 py-3 border-y border-slate-50">
          <div className="flex items-center gap-2 text-sm text-slate-600 min-w-0">
            <MapPin size={14} className="text-slate-400 flex-shrink-0" />
            <span className="truncate">{session.room}</span>
          </div>
          {session.instructor && (
            <div className="flex items-center gap-2 text-sm text-slate-600 min-w-0">
              <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                {session.instructorAvatar}
              </div>
              <span className="truncate">{session.instructor}</span>
            </div>
          )}
        </div>

        {/* שורה תחתונה: תפוסה */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-500">תפוסת שיעור</span>
            <span
              className={
                session.students >= session.capacity
                  ? "text-red-500"
                  : "text-slate-900"
              }
            >
              {session.students} / {session.capacity}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                session.students >= session.capacity
                  ? "bg-red-500"
                  : "bg-indigo-500"
              }`}
              style={{
                width: `${Math.min(
                  (session.students / session.capacity) * 100,
                  100
                )}%`,
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};
