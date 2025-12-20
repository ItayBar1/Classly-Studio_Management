import React, { useEffect, useState } from 'react';
import { BookOpen, CheckCircle, Loader2 } from 'lucide-react';
import { EnrollmentService } from '../../services/api';
import { ClassSession } from '../../types/types';
import { CourseCard } from './CourseCard'; // שימוש חוזר בקומפוננטה (יש לוודא שהיא תומכת במצב "צפייה" ללא הרשמה)

export const StudentDashboard: React.FC = () => {
  const [enrolledCourses, setEnrolledCourses] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnrolled = async () => {
      try {
        const data = await EnrollmentService.getMyEnrollments();
        setEnrolledCourses(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEnrolled();
  }, []);

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">הקורסים שלי</h2>

      {enrolledCourses.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="text-indigo-600" size={32} />
          </div>
          <h3 className="text-lg font-medium text-slate-900">עדיין לא נרשמת לקורסים</h3>
          <p className="text-slate-500 mt-2 mb-6">הירשם לקורסים חדשים כדי לראות אותם כאן</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrolledCourses.map(course => (
            // כאן אנו משתמשים בכרטיס הקורס אבל מבטלים את כפתור ההרשמה או משנים אותו
            <div key={course.id} className="relative">
              <div className="absolute top-2 left-2 z-10 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                <CheckCircle size={12} /> רשום
              </div>
              <CourseCard course={course} onRegister={() => { }} />
              {/* יש להתאים את CourseCard כך שלא יציג כפתור הרשמה אם onRegister ריק או להוסיף פרופ isEnrolled */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};