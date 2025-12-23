import React, { useEffect, useState } from "react";
import { CourseService } from "../../services/api";
import { Loader2, Calendar, Filter, X } from "lucide-react";
import { ClassCard } from "../common/ClassCard";

export const InstructorSchedule: React.FC = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | "all">("all");

  const days = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

  useEffect(() => {
    const fetchMySchedule = async () => {
      try {
        const data = await CourseService.getInstructorCourses();

        if (data) {
          const formatClassForDisplay = (cls: any) => {
            if (!cls) return null;

            // לוג לבדיקה - תראה ב-Console מה השמות האמיתיים של השדות מהשרת
            console.log("Raw class object:", cls);

            const today = "1970-01-01";
            // וידוא שמות שדות (תמיכה גם ב-snake_case וגם ב-CamelCase)
            const startStr = cls.start_time || cls.startTime || "00:00";
            const endStr = cls.end_time || cls.endTime || "00:00";
            const day =
              cls.day_of_week !== undefined ? cls.day_of_week : cls.dayOfWeek;

            const start = new Date(`${today}T${startStr}`);
            const end = new Date(`${today}T${endStr}`);
            const duration = (end.getTime() - start.getTime()) / 60000;
            const dayOfWeekIndex = cls.day_of_week;

            return {
              id: cls.id,
              name: cls.name,
              instructor: cls.instructor?.full_name || "אני",
              instructorAvatar: (cls.instructor?.full_name || "א")
                .charAt(0)
                .toUpperCase(),
              startTime: startStr.substring(0, 5),
              duration: duration,
              dayOfWeek: dayOfWeekIndex,
              dayName: days[dayOfWeekIndex],
              students: cls.current_enrollment || 0,
              capacity: cls.max_capacity,
              level: cls.level,
              room: cls.location_room || "לא צוין",
            };
          };

          const sorted = data.sort((a: any, b: any) => {
            if (a.day_of_week !== b.day_of_week)
              return a.day_of_week - b.day_of_week;
            return a.start_time.localeCompare(b.start_time);
          });

          setClasses(sorted.map(formatClassForDisplay).filter(Boolean));
        }
      } catch (err) {
        console.error("Error fetching schedule:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMySchedule();
  }, []);

  const displayedClasses =
    selectedDay === "all"
      ? classes
      : classes.filter((cls) => cls.dayOfWeek === selectedDay);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              מערכת השעות שלי
            </h2>
            <p className="text-slate-500 mt-1">
              {selectedDay === "all"
                ? `מציג את כל ${classes.length} השיעורים שלך`
                : `מציג ${displayedClasses.length} שיעורים ליום ${
                    days[selectedDay as number]
                  }`}
            </p>
          </div>

          {selectedDay !== "all" && (
            <button
              onClick={() => setSelectedDay("all")}
              className="flex items-center text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
            >
              <X className="h-4 w-4 ml-1" />
              הצג הכל
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2">
          <div className="flex items-center text-slate-500 ml-2">
            <Filter className="h-4 w-4 ml-1" />
            <span className="text-sm font-medium">סינון:</span>
          </div>

          <button
            onClick={() => setSelectedDay("all")}
            className={`
              px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border
              ${
                selectedDay === "all"
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }
            `}
          >
            הכל
          </button>

          {days.map((day, index) => {
            const hasClasses = classes.some((c) => c.dayOfWeek === index);
            if (!hasClasses && selectedDay !== index) return null;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(index)}
                className={`
                  px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border
                  ${
                    selectedDay === index
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                      : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                  }
                `}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-6">
        {displayedClasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            {displayedClasses.map((cls) => (
              // ✅ התיקון כאן: העברת הנתונים בתוך prop בשם session
              <ClassCard key={cls.id} session={cls} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-center">
            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
              <Calendar className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              לא נמצאו שיעורים
            </h3>
            <p className="text-slate-500 max-w-sm mt-1">
              {selectedDay === "all"
                ? "עדיין לא שובצת לשיעורים במערכת."
                : `אין שיעורים מתוכננים ליום ${days[selectedDay as number]}.`}
            </p>
            {selectedDay !== "all" && (
              <button
                onClick={() => setSelectedDay("all")}
                className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
              >
                חזור לרשימה המלאה
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
