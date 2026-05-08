import React, { useState, useEffect } from "react";
import { BaseModal } from "../common/BaseModal";
import { EnrollmentService, AttendanceService } from "../../services/api";
import { CheckCircle, XCircle, Clock, Save, Check } from "lucide-react";
import toast from "react-hot-toast";

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  className: string;
  date: string; // YYYY-MM-DD
  onSaved?: () => void;
}

interface StudentRecord {
  studentId: string;
  name: string;
  profileImage?: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | null;
  notes: string;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
  classId,
  className,
  date,
  onSaved,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [records, setRecords] = useState<StudentRecord[]>([]);

  useEffect(() => {
    if (isOpen && classId && date) {
      loadData();
    }
  }, [isOpen, classId, date]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch enrollments
      const enrollments = await EnrollmentService.getClassEnrollments(classId);
      
      // 2. Fetch existing attendance for this class and date
      const existingAtt = await AttendanceService.getClassAttendance(classId, date);
      
      // Create a map of existing attendance status by student ID
      const attMap = new Map<string, any>();
      existingAtt.forEach((a: any) => {
        attMap.set(a.student_id, a);
      });

      const initialRecords: StudentRecord[] = enrollments.map((enr: any) => {
        const existing = attMap.get(enr.student.id);
        return {
          studentId: enr.student.id,
          name: enr.student.full_name,
          profileImage: enr.student.profile_image_url,
          status: existing ? existing.status : null,
          notes: existing?.notes || "",
        };
      });

      setRecords(initialRecords);
    } catch (error) {
      console.error("Failed to load attendance data", error);
      toast.error("שגיאה בטעינת נתונים");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId: string, status: StudentRecord["status"]) => {
    setRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, status } : r))
    );
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, notes } : r))
    );
  };

  const handleSave = async (sessionStatus: "IN_PROGRESS" | "COMPLETED") => {
    // Make sure we only send records that have a status selected
    const validRecords = records.filter(r => r.status !== null);
    
    if (sessionStatus === "COMPLETED" && validRecords.length < records.length) {
      const confirmComplete = window.confirm("לא כל התלמידים סומנו. האם אתה בטוח שברצונך לסיים?");
      if (!confirmComplete) return;
    }

    setSaving(true);
    try {
      await AttendanceService.recordAttendance({
        classId,
        date,
        sessionStatus,
        records: validRecords.map(r => ({
          studentId: r.studentId,
          status: r.status,
          notes: r.notes
        }))
      });
      
      toast.success(sessionStatus === "COMPLETED" ? "נוכחות נשמרה בהצלחה" : "טיוטה נשמרה");
      if (onSaved) onSaved();
      onClose();
    } catch (error) {
      console.error("Failed to save attendance", error);
      toast.error("שגיאה בשמירת נוכחות");
    } finally {
      setSaving(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`נוכחות: ${className}`}
      size="2xl"
    >
      <div className="flex flex-col h-[600px]">
        <div className="flex justify-between items-center mb-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="font-medium text-slate-700 dark:text-slate-300">
            תאריך שיעור: <span className="font-bold">{date.split('-').reverse().join('/')}</span>
          </div>
          <div className="text-sm text-slate-500">
            {records.filter(r => r.status !== null).length} / {records.length} סומנו
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : records.length === 0 ? (
          <div className="flex-1 flex justify-center items-center text-slate-500">
            אין תלמידים רשומים לשיעור זה
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
            {records.map((record) => (
              <div 
                key={record.studentId}
                className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center gap-4 transition-colors ${
                  record.status === 'PRESENT' ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800/50' :
                  record.status === 'ABSENT' ? 'bg-rose-50/50 border-rose-200 dark:bg-rose-900/10 dark:border-rose-800/50' :
                  record.status === 'LATE' ? 'bg-amber-50/50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800/50' :
                  'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                    {record.profileImage ? (
                      <img src={record.profileImage} alt={record.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-slate-500 font-bold">{record.name.charAt(0)}</span>
                    )}
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{record.name}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStatusChange(record.studentId, "PRESENT")}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      record.status === "PRESENT" 
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" 
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                    }`}
                  >
                    <CheckCircle size={16} /> נוכח
                  </button>
                  <button
                    onClick={() => handleStatusChange(record.studentId, "ABSENT")}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      record.status === "ABSENT" 
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300" 
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                    }`}
                  >
                    <XCircle size={16} /> חיסרון
                  </button>
                  <button
                    onClick={() => handleStatusChange(record.studentId, "LATE")}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      record.status === "LATE" 
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" 
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                    }`}
                  >
                    <Clock size={16} /> איחור
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between gap-3">
          <button
            onClick={() => handleSave("IN_PROGRESS")}
            disabled={saving || records.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-indigo-200 text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-colors disabled:opacity-50 dark:bg-transparent dark:border-indigo-900 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
          >
            <Save size={18} />
            שמור כטיוטה
          </button>
          
          <button
            onClick={() => handleSave("COMPLETED")}
            disabled={saving || records.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Check size={18} />
            סיום דיווח
          </button>
        </div>
      </div>
    </BaseModal>
  );
};
