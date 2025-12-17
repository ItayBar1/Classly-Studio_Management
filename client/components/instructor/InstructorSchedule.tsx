import React, { useEffect, useState } from 'react';
import { CourseService } from '../../services/api';
import { Loader2, MapPin, Users } from 'lucide-react';
import { ClassSession } from '../../types/types';

export const InstructorSchedule: React.FC = () => {
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMySchedule = async () => {
      try {
        // ה-API מזהה את המדריך לפי הטוקן ומחזיר את הקורסים שלו
        const data = await CourseService.getInstructorCourses();
        
        // מיון הקורסים לפי יום ושעה (אפשר גם בשרת, אך בטוח לעשות גם כאן)
        const sorted = data.sort((a, b) => {
          if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
          return a.start_time.localeCompare(b.start_time);
        });

        setClasses(sorted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMySchedule();
  }, []);

  const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin"/></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">מערכת השעות שלי</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((cls) => (
          <div key={cls.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-r-4 border-r-indigo-500">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                {days[cls.day_of_week]}
              </span>
              <span className="text-sm font-medium text-slate-500">
                {cls.start_time.slice(0,5)} - {cls.end_time.slice(0,5)}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">{cls.name}</h3>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-slate-400" />
                {cls.location_room || 'לא צוין מיקום'}
              </div>
              <div className="flex items-center gap-2">
                <Users size={16} className="text-slate-400" />
                {cls.current_enrollment} / {cls.max_capacity} רשומים
              </div>
            </div>
          </div>
        ))}
        {classes.length === 0 && (
          <p className="col-span-3 text-center text-slate-500 py-10">אין שיעורים משובצים במערכת.</p>
        )}
      </div>
    </div>
  );
};