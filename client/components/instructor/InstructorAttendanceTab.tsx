import React, { useState, useEffect } from "react";
import { AttendanceService } from "../../services/api";
import { PageHeader } from "../common/PageHeader";
import { ClipboardList, AlertCircle, CheckCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { AttendanceModal } from "./AttendanceModal";

interface SessionInfo {
  classId: string;
  className: string;
  branchName: string;
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "MISSING" | "IN_PROGRESS" | "COMPLETED";
}

export const InstructorAttendanceTab: React.FC = () => {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<SessionInfo | null>(null);

  const fetchSessions = async () => {
    try {
      const data = await AttendanceService.getSessions();
      setSessions(data);
    } catch (error) {
      console.error("Failed to fetch sessions", error);
      toast.error("שגיאה בטעינת שיעורים");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Format date to DD/MM/YYYY
  const formatDate = (dateStr: string) => {
    return dateStr.split("-").reverse().join("/");
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      <PageHeader
        title="נוכחות"
        subtitle="דיווח ומעקב אחר נוכחות בשיעורים שלך"
        icon={<ClipboardList size={28} className="text-indigo-600 dark:text-indigo-400" />}
      />

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6">
          שיעורים אחרונים
        </h3>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            לא נמצאו שיעורים ב-30 הימים האחרונים.
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session, index) => (
              <div
                key={`${session.classId}-${session.date}-${index}`}
                onClick={() => setSelectedSession(session)}
                className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer transition-all hover:shadow-md ${
                  session.status === 'COMPLETED' 
                    ? 'bg-slate-50 border-slate-200 hover:border-slate-300 dark:bg-slate-800/30 dark:border-slate-700/50' 
                    : session.status === 'IN_PROGRESS'
                    ? 'bg-amber-50/50 border-amber-200 hover:border-amber-300 dark:bg-amber-900/10 dark:border-amber-800/50'
                    : 'bg-white border-rose-200 hover:border-rose-300 shadow-[0_0_10px_rgba(225,29,72,0.05)] dark:bg-slate-900 dark:border-rose-900/50'
                }`}
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-lg text-slate-800 dark:text-slate-200">
                      {session.className}
                    </span>
                    <span className="text-sm font-medium text-slate-500">
                      ({session.branchName} - {session.roomName})
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                    <span>{formatDate(session.date)}</span>
                    <span>•</span>
                    <span>{session.startTime} - {session.endTime}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {session.status === 'COMPLETED' ? (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 rounded-full text-sm font-bold">
                      <CheckCircle size={16} />
                      הושלם
                    </span>
                  ) : session.status === 'IN_PROGRESS' ? (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 rounded-full text-sm font-bold">
                      <Clock size={16} />
                      טיוטה
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400 rounded-full text-sm font-bold">
                      <AlertCircle size={16} />
                      חסר דיווח
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedSession && (
        <AttendanceModal
          isOpen={!!selectedSession}
          onClose={() => setSelectedSession(null)}
          classId={selectedSession.classId}
          className={selectedSession.className}
          date={selectedSession.date}
          onSaved={() => fetchSessions()}
        />
      )}
    </div>
  );
};
