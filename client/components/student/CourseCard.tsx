import React from "react";
import { MapPin, User, Users, Calendar } from "lucide-react";

// המרת ימי השבוע למספרים לטובת תצוגה
const DAY_MAP: Record<number, string> = {
  0: "ראשון",
  1: "שני",
  2: "שלישי",
  3: "רביעי",
  4: "חמישי",
  5: "שישי",
  6: "שבת",
};

interface CourseCardProps {
  course: any;
  onRegister: (course: any) => void;
  isEnrolled?: boolean; // פרופ אופציונלי חדש
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onRegister,
  isEnrolled = false,
}) => {
  // חישוב מקומות פנויים
  const spotsLeft = course.max_capacity - (course.current_enrollment || 0);
  const isFull = spotsLeft <= 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all flex flex-col h-full">
      {/* Header with Color Stripe */}
      <div className="h-2 bg-indigo-500 w-full"></div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
            {course.category?.name || "כללי"}
          </span>
          <span className="text-lg font-bold text-slate-800">
            ₪{course.price_ils}
          </span>
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-2">{course.name}</h3>
        <p className="text-slate-500 text-sm line-clamp-2 mb-4 flex-1">
          {course.description || "אין תיאור זמין"}
        </p>

        <div className="space-y-2 text-sm text-slate-600 mb-6">
          <div className="flex items-center gap-2">
            <User size={16} className="text-slate-400" />
            <span>{course.instructor?.full_name || "מדריך לא ידוע"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-slate-400" />
            <span>
              יום {DAY_MAP[course.day_of_week]} •{" "}
              {course.start_time.substring(0, 5)} -{" "}
              {course.end_time.substring(0, 5)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-slate-400" />
            <span>{course.location_room || "סטודיו ראשי"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={16} className="text-slate-400" />
            <span className={isFull ? "text-red-500 font-bold" : ""}>
              {isFull ? "השיעור מלא" : `נותרו ${spotsLeft} מקומות`}
            </span>
          </div>
        </div>

        <button
          onClick={() => onRegister(course)}
          disabled={isFull || isEnrolled} // נטרול אם מלא או רשום
          className={`w-full py-2.5 rounded-lg font-bold transition-colors ${
            isEnrolled
              ? "bg-green-100 text-green-700 cursor-not-allowed border border-green-200" // עיצוב למצב רשום
              : isFull
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg"
          }`}
        >
          {isEnrolled
            ? "אתה כבר רשום לקורס"
            : isFull
            ? "הרשמה נסגרה"
            : "הרשמה ותשלום"}
        </button>
      </div>
    </div>
  );
};
