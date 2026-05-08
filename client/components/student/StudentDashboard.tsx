import React, { useEffect, useState } from "react";
import { BookOpen, CheckCircle, Loader2 } from "lucide-react";
import { EnrollmentService } from "../../services/api";
import { ClassCard } from "../common/ClassCard";
import { PageHeader } from "../common/PageHeader";
import { LoadingState, EmptyState } from "../common/StateDisplay";
import { DAY_MAP, extractTime } from "../../utils/dateUtils";
import { ClassSession } from "../../types/types";

interface StudentDashboardProps {
  activeTab?: string;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  activeTab,
}) => {
  const [enrolledCourses, setEnrolledCourses] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEnrolled = async () => {
    try {
      const data = await EnrollmentService.getMyEnrollments();

      const courses = data
        .map((enrollment: any) => {
          if (enrollment.class) {
            const cls = enrollment.class;
            return {
              id: cls.id || enrollment.class_id,
              name: cls.name,
              dayName: DAY_MAP[cls.day_of_week] || "",
              instructor: cls.instructor?.full_name || "מדריך לא ידוע",
              startTime: extractTime(cls.start_time),
              endTime: extractTime(cls.end_time),
              duration: cls.duration || 60,
              students: cls.current_enrollment || 0,
              capacity: cls.max_capacity || 20,
              level: cls.level || "ALL_LEVELS",
              room: cls.location_room || "סטודיו ראשי",
              color: cls.color || "indigo",
              description: cls.description,
              price_ils: cls.price_ils,
              categoryName: cls.category?.name,
              original: cls
            };
          }
          return null;
        })
        .filter(Boolean);

      setEnrolledCourses(courses);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrolled();
  }, []);

  // Refresh data when switching to this tab
  useEffect(() => {
    if (activeTab === "dashboard") {
      setLoading(true);
      fetchEnrolled();
    }
  }, [activeTab]);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <PageHeader title="הקורסים שלי" />

      {enrolledCourses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="עדיין לא נרשמת לקורסים"
          description="הירשם לקורסים חדשים כדי לראות אותם כאן"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrolledCourses.map((course: any) => (
            <div key={course.id} className="relative h-full">
              <div className="absolute top-2 left-2 z-10 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 dark:bg-green-900/50 dark:text-green-400">
                <CheckCircle size={12} /> רשום
              </div>
              <ClassCard
                session={course}
                isStudent={true}
                isEnrolled={true}
                hideRegisterButton={true}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
