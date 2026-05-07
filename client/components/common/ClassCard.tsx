import React, { useState, useRef, useEffect } from "react";
import { Clock, Calendar, MapPin, MoreVertical, Edit2, Trash2 } from "lucide-react";

interface ClassSession {
  id: string;
  name: string;
  dayName?: string;
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
  isCompact?: boolean;
  onEdit?: (session: any) => void;
  onDelete?: (id: string, e: React.MouseEvent) => void;
  onClick?: () => void;
}

export const ClassCard: React.FC<ClassCardProps> = ({
  session,
  isAdmin,
  isCompact,
  onEdit,
  onDelete,
  onClick,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
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
    <div 
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm border border-slate-100 transition-all group relative flex flex-col dark:bg-slate-900 dark:border-slate-800 ${onClick ? 'cursor-pointer hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800' : ''} ${isCompact ? 'p-2 h-full overflow-hidden hover:z-50' : 'p-5'}`}
    >
      {/* Decorative side color bar */}
      <div
        className={`absolute right-0 top-0 bottom-0 ${isCompact ? 'w-1' : 'w-1.5'} ${getColorClasses(
          session.color || "indigo"
        )}`}
      ></div>

      {isCompact ? (
        <div className="flex flex-col gap-1 min-h-0 flex-1">
          <div className="flex justify-between items-start gap-1">
            <h3 className="text-lg font-bold text-slate-800 truncate dark:text-slate-100 leading-tight">
              {session.name}
            </h3>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span
                className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold ${getLevelBadgeColor(
                  session.level
                )}`}
              >
                {translateLevel(session.level)}
              </span>
              {isAdmin && (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(!isMenuOpen);
                    }}
                    className="p-0.5 rounded-md text-slate-400 hover:text-slate-600 transition-colors bg-white/80 dark:bg-slate-900/80"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {isMenuOpen && (
                    <div className="absolute left-0 top-full mt-1 w-28 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-50 dark:bg-slate-800 dark:border-slate-700">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMenuOpen(false);
                          onEdit?.(session);
                        }}
                        className="w-full text-right px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 dark:text-slate-200 dark:hover:bg-slate-700/50"
                      >
                        <Edit2 size={14} />
                        עריכה
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMenuOpen(false);
                          setShowDeleteConfirm(true);
                        }}
                        className="w-full text-right px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 dark:text-red-400 dark:hover:bg-red-500/10"
                      >
                        <Trash2 size={14} />
                        מחיקה
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {session.instructor && (
            <div className="flex items-center gap-1 mt-0.5 text-sm font-medium text-slate-600 min-w-0 dark:text-slate-400">
              <span className="truncate">{session.instructor}</span>
            </div>
          )}

          <div className="mt-auto space-y-1">
            <div className="flex justify-between text-[10px] font-bold leading-none">
              <span className="text-slate-500 dark:text-slate-400">
                תפוסה
              </span>
              <span
                className={
                  session.students >= session.capacity
                    ? "text-red-500 dark:text-red-400"
                    : "text-slate-900 dark:text-slate-200"
                }
              >
                {session.students} / {session.capacity}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden dark:bg-slate-800">
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
      ) : (
        <div className="flex flex-col gap-4 min-h-0 flex-1">
          {/* Top row: Time, Title, and Day */}
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0 flex-1">
              {/* Display Day of the Week */}
              {session.dayName && (
                <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-1 dark:text-indigo-400">
                  <Calendar size={12} />
                  {/* @ts-ignore - Assuming dayName is passed from parent */}
                  <span>יום {session.dayName}</span>
                </div>
              )}

              <h3 className="text-lg font-bold text-slate-800 truncate dark:text-slate-100">
                {session.name}
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-slate-500 font-semibold text-sm mt-1 dark:text-slate-400">
                <Clock size={14} className="flex-shrink-0" />
                <span>{session.startTime} - {session.endTime || '??'}</span>
                <span className="text-slate-400 font-normal dark:text-slate-500 whitespace-nowrap">
                  ({session.duration} דק׳)
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <div className="flex items-center gap-1">
                <span
                  className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${getLevelBadgeColor(
                    session.level
                  )}`}
                >
                  {translateLevel(session.level)}
                </span>
                {isAdmin && (
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMenuOpen(!isMenuOpen);
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors dark:hover:bg-slate-800 dark:hover:text-slate-300 bg-white/80 backdrop-blur-sm"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {isMenuOpen && (
                      <div className="absolute left-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-10 dark:bg-slate-800 dark:border-slate-700">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsMenuOpen(false);
                            onEdit?.(session);
                          }}
                          className="w-full text-right px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 dark:text-slate-200 dark:hover:bg-slate-700/50"
                        >
                          <Edit2 size={14} />
                          עריכה
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsMenuOpen(false);
                            setShowDeleteConfirm(true);
                          }}
                          className="w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 dark:text-red-400 dark:hover:bg-red-500/10"
                        >
                          <Trash2 size={14} />
                          מחיקה
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Middle row: Location and Instructor */}
          <div className="grid grid-cols-2 gap-2 py-3 border-y border-slate-50 dark:border-slate-800/50 mt-auto">
            <div className="flex items-center gap-2 text-sm text-slate-600 min-w-0 dark:text-slate-400">
              <MapPin
                size={14}
                className="text-slate-400 flex-shrink-0 dark:text-slate-500"
              />
              <span className="truncate">{session.room}</span>
            </div>
            {session.instructor && (
              <div className="flex items-center gap-2 text-sm text-slate-600 min-w-0 dark:text-slate-400">
                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 dark:bg-indigo-900/50 dark:text-indigo-400">
                  {session.instructorAvatar}
                </div>
                <span className="truncate">{session.instructor}</span>
              </div>
            )}
          </div>

          {/* Bottom row: Capacity */}
          <div className="space-y-2 mt-auto">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-500 dark:text-slate-400">
                תפוסת שיעור
              </span>
              <span
                className={
                  session.students >= session.capacity
                    ? "text-red-500 dark:text-red-400"
                    : "text-slate-900 dark:text-slate-200"
                }
              >
                {session.students} / {session.capacity}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden dark:bg-slate-800">
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
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden dark:bg-slate-900 border border-slate-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center mx-auto mb-4 dark:bg-red-500/20">
                <Trash2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2 dark:text-slate-100">האם אתה בטוח?</h3>
              <p className="text-slate-500 text-sm mb-6 dark:text-slate-400">
                האם למחוק את השיעור <strong>{session.name}</strong>? פעולה זו אינה הפיכה.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(false);
                  }}
                  className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  לא
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(false);
                    onDelete?.(session.id, e);
                  }}
                  className="flex-1 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                >
                  כן
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
