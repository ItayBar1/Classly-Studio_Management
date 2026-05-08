import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Calendar, 
  CheckCircle,
  Clock,
} from 'lucide-react';
import { DashboardService } from '../../services/api';
import { InstructorStats } from '../../types/types';
import { PageHeader } from '../common/PageHeader';
import { StatCard } from '../common/StatCard';
import { LoadingState } from '../common/StateDisplay';
import { AttendanceModal } from './AttendanceModal';
import toast from "react-hot-toast";

export const InstructorDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<InstructorStats | null>(null);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);

  const fetchStats = async () => {
    try {
      const data = await DashboardService.getInstructorStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching instructor data:', error);
      toast.error("שגיאה בטעינת הנתונים");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return <LoadingState />;
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="לוח בקרה למדריך"
        subtitle="סיכום פעילות הקורסים שלך"
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="הקורסים שלי"
          value={stats.myCoursesCount}
          subtext="קורסים פעילים"
          icon={Calendar}
          color="bg-indigo-500"
        />
        <StatCard
          title="סה״כ תלמידים"
          value={stats.myStudentsCount}
          subtext="תלמידים רשומים"
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="שיעורים היום"
          value={stats.todayClassesCount}
          subtext="מתוכננים להיום"
          icon={Clock}
          color="bg-green-500"
        />
      </div>

      {/* Next Class Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <CheckCircle className="text-indigo-600" size={20} />
          השיעור הבא במערכת
        </h3>
        {stats.nextClass ? (
          <div 
            onClick={() => setIsAttendanceModalOpen(true)}
            className="bg-slate-50 p-4 rounded-lg border border-slate-200 cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 transition-all group"
          >
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-bold text-lg text-slate-800 group-hover:text-indigo-700 transition-colors">{stats.nextClass.name}</h4>
                <p className="text-slate-500">
                  {['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'][stats.nextClass.day_of_week]} • {stats.nextClass.start_time.slice(0,5)}
                </p>
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                  {stats.nextClass.current_enrollment} רשומים
                </span>
                <span className="text-xs font-medium text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  לחץ לדיווח נוכחות
                </span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-slate-500">אין שיעורים קרובים במערכת.</p>
        )}
      </div>

      {isAttendanceModalOpen && stats.nextClass && (
        <AttendanceModal
          isOpen={isAttendanceModalOpen}
          onClose={() => setIsAttendanceModalOpen(false)}
          classId={stats.nextClass.id}
          className={stats.nextClass.name}
          date={new Date(stats.nextClass.nextDate).toISOString().split('T')[0]}
          onSaved={() => fetchStats()}
        />
      )}
    </div>
  );
};