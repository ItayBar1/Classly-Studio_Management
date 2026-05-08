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
  description?: string;
  price_ils?: number;
  categoryName?: string;
  original?: any; // For editing
}

interface ClassCardProps {
  session: ClassSession;
  isAdmin?: boolean;
  isCompact?: boolean;
  isStudent?: boolean;
  isEnrolled?: boolean;
  hideRegisterButton?: boolean;
  onEdit?: (session: any) => void;
  onDelete?: (id: string, e: React.MouseEvent) => void;
  onRegister?: (session: any) => void;
  onClick?: () => void;
}

export const ClassCard: React.FC<ClassCardProps> = ({
  session,
  isAdmin,
  isCompact,
  isStudent,
  isEnrolled,
  hideRegisterButton,
  onEdit,
  onDelete,
  onRegister,
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
      className={`${session.bgColor || 'bg-white dark:bg-slate-900'} rounded-xl shadow-sm border border-slate-100 transition-all group relative flex flex-col dark:border-slate-800 h-full ${onClick ? 'cursor-pointer hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800' : ''} ${isCompact ? 'p-2 overflow-hidden hover:z-50' : 'overflow-hidden hover:shadow-md'}`}
    >
      {/* Decorative side color bar for compact, top bar for expanded */}
      {isCompact ? (
        <div
          className={`absolute right-0 top-0 bottom-0 w-1 ${session.sideColor || getColorClasses(
            session.color || "indigo"
          )}`}
        ></div>
      ) : (
        <div className={`h-2 w-full ${getColorClasses(session.color || "indigo")}`}></div>
      )}

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
        <div className="p-5 flex-1 flex flex-col">
          {/* Expanded Card Header */}
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-1 rounded-full">
                {session.categoryName || "כללי"}
              </span>
              <span
                className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-bold ${getLevelBadgeColor(
                  session.level
                )}`}
              >
                {translateLevel(session.level)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {session.price_ils !== undefined && (
                <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  ₪{session.price_ils}
                </span>
              )}
              {isAdmin && (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(!isMenuOpen);
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors dark:hover:bg-slate-800 dark:hover:text-slate-300"
                  >
                    <MoreVertical size={18} />
                  </button>
                  {isMenuOpen && (
                    <div className="absolute left-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-10 dark:bg-slate-800 dark:border-slate-700">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMenuOpen(false);
                          onEdit?.(session.original || session);
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

          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{session.name}</h3>
          
          {session.description && (
            <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 mb-4 flex-1">
              {session.description}
            </p>
          )}

          <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400 mb-6 mt-auto">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-slate-400" />
              <span>
                {session.dayName && `יום ${session.dayName} • `}
                {session.startTime} {session.endTime ? `- ${session.endTime}` : `(${session.duration} דק׳)`}
              </span>
            </div>
            
            {session.instructor && (
              <div className="flex items-center gap-2">
                {session.instructorAvatar ? (
                  <div className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[8px] font-bold dark:bg-indigo-900/50 dark:text-indigo-400">
                    {session.instructorAvatar}
                  </div>
                ) : (
                  <Calendar size={16} className="text-slate-400" />
                )}
                <span>{session.instructor}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-slate-400" />
              <span>{session.room || "סטודיו ראשי"}</span>
            </div>
            
            {/* Show capacity info or spots left depending on role */}
            {isStudent ? (
              <div className="flex items-center gap-2">
                <span className={session.students >= session.capacity ? "text-red-500 font-bold dark:text-red-400" : ""}>
                  {session.students >= session.capacity ? "השיעור מלא" : `נותרו ${session.capacity - session.students} מקומות`}
                </span>
              </div>
            ) : (
              <div className="space-y-1 mt-4">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500 dark:text-slate-400">תפוסת שיעור</span>
                  <span className={session.students >= session.capacity ? "text-red-500 dark:text-red-400" : "text-slate-900 dark:text-slate-200"}>
                    {session.students} / {session.capacity}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden dark:bg-slate-800">
                  <div
                    className={`h-full transition-all duration-500 ${session.students >= session.capacity ? "bg-red-500" : "bg-indigo-500"}`}
                    style={{ width: `${Math.min((session.students / session.capacity) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Student Action Button */}
          {isStudent && !hideRegisterButton && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRegister?.(session.original || session);
              }}
              disabled={session.students >= session.capacity || isEnrolled}
              className={`w-full py-2.5 rounded-lg font-bold transition-colors mt-auto ${
                isEnrolled
                  ? "bg-green-100 text-green-700 cursor-not-allowed border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                  : session.students >= session.capacity
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg"
              }`}
            >
              {isEnrolled ? "אתה כבר רשום לקורס" : session.students >= session.capacity ? "הרשמה נסגרה" : "הרשמה ותשלום"}
            </button>
          )}
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
