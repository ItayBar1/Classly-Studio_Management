import React, { useState, useEffect } from "react";
import { Clock, Users, MapPin, MoreHorizontal, Edit, Trash2 } from "lucide-react";

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

export const ClassCard: React.FC<ClassCardProps> = ({ session, isAdmin, onEdit, onDelete }) => {
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setActiveMenuId(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

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

    const getColorClasses = (color: string) => "bg-indigo-500";

    return (
        <div
            className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow group relative"
        >
            {/* Color Stripe */}
            <div className={`absolute right-0 top-0 bottom-0 w-1.5 rounded-r-xl ${getColorClasses(session.color || 'indigo')}`}></div>

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
                        {session.instructor && (
                            <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                                    {session.instructorAvatar || '?'}
                                </div>
                                {session.instructor}
                            </div>
                        )}
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

                    {isAdmin && (
                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuId(activeMenuId === session.id ? null : session.id);
                                }}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-full transition-colors mr-auto md:mr-0 relative z-50" // z-50 to ensure clickability
                            >
                                <MoreHorizontal size={20} />
                            </button>

                            {/* Dropdown Menu */}
                            {activeMenuId === session.id && (
                                <div className="absolute left-0 bottom-full mb-2 w-32 bg-white rounded-lg shadow-xl border border-slate-100 py-1 z-50 animate-fadeIn origin-bottom-left">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onEdit?.(session); }}
                                        className="w-full text-right px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                        <Edit size={14} /> ערוך
                                    </button>
                                    <button
                                        onClick={(e) => onDelete?.(session.id, e)}
                                        className="w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                        <Trash2 size={14} /> מחק
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
