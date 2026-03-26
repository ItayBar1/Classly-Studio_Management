import React, { useState, useEffect } from "react";
import { Loader2, BookOpen, Check } from "lucide-react";
import { BaseModal } from "../common/BaseModal";
import { CourseService, EnrollmentService } from "../../services/api";
import { ClassSession } from "../../types/types";
import { DAY_MAP } from "../../utils/dateUtils";

interface EnrollStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  onSuccess: () => void;
}

export const EnrollStudentModal: React.FC<EnrollStudentModalProps> = ({
  isOpen,
  onClose,
  studentId,
  studentName,
  onSuccess,
}) => {
  const [courses, setCourses] = useState<ClassSession[]>([]);
  const [enrolledClassIds, setEnrolledClassIds] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      Promise.all([
        CourseService.getAll({ status: "active" }),
        EnrollmentService.getStudentEnrollments(studentId),
      ])
        .then(([allCourses, enrollments]) => {
          setCourses(allCourses || []);
          setEnrolledClassIds(
            new Set((enrollments || []).map((e: any) => e.class_id))
          );
        })
        .catch(() => setError("שגיאה בטעינת הקורסים"))
        .finally(() => setLoading(false));
    }
  }, [isOpen, studentId]);

  const handleEnroll = async (classId: string) => {
    setEnrollingId(classId);
    setError(null);
    try {
      await EnrollmentService.adminEnroll(studentId, classId);
      setSuccessId(classId);
      setEnrolledClassIds((prev) => new Set(prev).add(classId));
      setTimeout(() => setSuccessId(null), 2000);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "שגיאה ברישום");
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`רישום ${studentName} לקורסים`}
    >
      <div className="space-y-3">
        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400 dark:text-slate-500">
            <Loader2 className="animate-spin mr-2" /> טוען קורסים...
          </div>
        ) : courses.length === 0 ? (
          <p className="text-center py-8 text-slate-500 dark:text-slate-400">
            אין קורסים פעילים כרגע.
          </p>
        ) : (
          courses.map((course) => (
            <div
              key={course.id}
              className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-200 transition-colors dark:bg-slate-800 dark:border-slate-700 dark:hover:border-indigo-500/50"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg dark:bg-indigo-500/10">
                  <BookOpen
                    size={18}
                    className="text-indigo-600 dark:text-indigo-400"
                  />
                </div>
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-200">
                    {course.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {DAY_MAP[course.day_of_week]} •{" "}
                    {course.start_time?.substring(0, 5)} •{" "}
                    {course.current_enrollment}/{course.max_capacity} תלמידים
                    {course.price_ils > 0 && (
                      <span className="mr-1">• ₪{course.price_ils}</span>
                    )}
                  </p>
                </div>
              </div>
              {enrolledClassIds.has(course.id) && successId !== course.id ? (
                <span className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400 flex items-center gap-1">
                  <Check size={14} /> כבר רשום
                </span>
              ) : (
                <button
                  onClick={() => handleEnroll(course.id)}
                  disabled={
                    enrollingId === course.id || successId === course.id
                  }
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    successId === course.id
                      ? "bg-green-100 text-green-700"
                      : "bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                  }`}
                >
                  {enrollingId === course.id ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : successId === course.id ? (
                    <span className="flex items-center gap-1">
                      <Check size={14} /> נרשם!
                    </span>
                  ) : (
                    "רשום"
                  )}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </BaseModal>
  );
};
