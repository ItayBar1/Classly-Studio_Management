import React, { useState, useEffect } from "react";
import { AttendanceService } from "../../services/api";
import { PageHeader } from "../common/PageHeader";
import { AttendanceSections } from "../common/AttendanceSections";
import { AttendanceModal } from "../common/AttendanceModal";
import { DateRangeFilter } from "../common/DateRangeFilter";
import { AttendanceItem } from "../common/attendanceUtils";
import { ClipboardList, X } from "lucide-react";
import toast from "react-hot-toast";

export const InstructorAttendanceTab: React.FC = () => {
  const [sessions, setSessions] = useState<AttendanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AttendanceItem | null>(null);
  const [range, setRange] = useState<{ from: string; to: string }>({
    from: "",
    to: "",
  });

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const params = {
        ...(range.from && { from: range.from }),
        ...(range.to && { to: range.to }),
      };
      const data = await AttendanceService.getSessions(params);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      <PageHeader
        title="נוכחות"
        subtitle="דיווח ומעקב אחר נוכחות בשיעורים שלך"
        icon={
          <ClipboardList
            size={28}
            className="text-indigo-600 dark:text-indigo-400"
          />
        }
      />

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            שיעורים אחרונים
          </h3>
          <div className="flex items-end gap-3">
            <div className="grid grid-cols-2 gap-3">
              <DateRangeFilter from={range.from} to={range.to} onChange={setRange} />
            </div>
            {(range.from || range.to) && (
              <button
                onClick={() => setRange({ from: "", to: "" })}
                className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 pb-2"
              >
                <X size={15} />
                נקה
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <AttendanceSections
            items={sessions}
            mode="session"
            onSelect={setSelected}
            emptyText="לא נמצאו שיעורים ב-30 הימים האחרונים."
          />
        )}
      </div>

      {selected && (
        <AttendanceModal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          classId={selected.classId}
          className={selected.className}
          date={selected.date}
          onSaved={() => fetchSessions()}
        />
      )}
    </div>
  );
};
