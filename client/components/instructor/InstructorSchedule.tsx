import React, { useEffect, useState } from 'react';
import { CourseService } from '../../services/api';
import { Loader2 } from 'lucide-react';
import { ClassSession } from '../../types/types';
import { ClassCard } from '../common/ClassCard';

export const InstructorSchedule: React.FC = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to format class for display (similar to Admin Schedule but simpler)
  const formatClassForDisplay = (cls: any) => {
    const today = "1970-01-01";
    const start = new Date(`${today}T${cls.start_time}`);
    const end = new Date(`${today}T${cls.end_time}`);
    const duration = (end.getTime() - start.getTime()) / 60000;

    return {
      id: cls.id,
      name: cls.name,
      // Instructor sees their own schedule, so instructor name is redundant but kept for layout consistency
      instructor: cls.instructor?.full_name,
      startTime: cls.start_time.substring(0, 5),
      duration: duration,
      dayOfWeek: cls.day_of_week, // Keep as number for sorting
      students: cls.current_enrollment || 0,
      capacity: cls.max_capacity,
      level: cls.level,
      room: cls.location_room || 'לא צוין מיקום',
      color: 'indigo',
    };
  };

  useEffect(() => {
    const fetchMySchedule = async () => {
      try {
        const data = await CourseService.getInstructorCourses();
        if (data) {
          // Sort by Day then Time
          const sorted = data.sort((a, b) => {
            if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
            return a.start_time.localeCompare(b.start_time);
          });
          const formatted = sorted.map(formatClassForDisplay);
          setClasses(formatted);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMySchedule();
  }, []);

  const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">מערכת השעות שלי</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((cls) => (
          <div key={cls.id} className="relative">
            {/* Add a day header above the card since this is a grid view, unlike the day-tab view in admin */}
            <div className="mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                {days[cls.dayOfWeek]}
              </span>
            </div>
            <ClassCard session={cls} isAdmin={false} />
          </div>
        ))}
        {classes.length === 0 && (
          <p className="col-span-3 text-center text-slate-500 py-10">אין שיעורים משובצים במערכת.</p>
        )}
      </div>
    </div>
  );
};