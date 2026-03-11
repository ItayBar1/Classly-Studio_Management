import React, { useState, useEffect } from 'react';
import { Loader2, XCircle, BookOpen } from 'lucide-react';
import { BaseModal } from '../common/BaseModal';
import { EnrollmentService } from '../../services/api';

interface Enrollment {
  id: string;
  status: string;
  class: {
    id: string;
    name: string;
    day_of_week: number;
    start_time: string;
    instructor?: { full_name: string };
  };
}

interface UnenrollStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  onSuccess: () => void;
}

export const UnenrollStudentModal: React.FC<UnenrollStudentModalProps> = ({
  isOpen, onClose, studentId, studentName, onSuccess
}) => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchEnrollments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await EnrollmentService.getStudentEnrollments(studentId);
      setEnrollments(data || []);
    } catch {
      setError('שגיאה בטעינת ההרשמות');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEnrollments();
    }
  }, [isOpen, studentId]);

  const handleRemove = async (enrollmentId: string) => {
    setRemovingId(enrollmentId);
    setError(null);
    try {
      await EnrollmentService.cancelEnrollment(enrollmentId);
      setEnrollments(prev => prev.filter(e => e.id !== enrollmentId));
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'שגיאה בהסרה מהקורס');
    } finally {
      setRemovingId(null);
    }
  };

  const DAY_MAP: Record<number, string> = {
    0: "ראשון", 1: "שני", 2: "שלישי", 3: "רביעי", 4: "חמישי", 5: "שישי", 6: "שבת"
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={`הסרת ${studentName} מקורסים`}>
      <div className="space-y-3">
        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400">{error}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400 dark:text-slate-500">
            <Loader2 className="animate-spin mr-2" /> טוען הרשמות...
          </div>
        ) : enrollments.length === 0 ? (
          <p className="text-center py-8 text-slate-500 dark:text-slate-400">התלמיד אינו רשום לאף קורס פעיל.</p>
        ) : (
          enrollments.map(enrollment => (
            <div
              key={enrollment.id}
              className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-red-200 transition-colors dark:bg-slate-800 dark:border-slate-700 dark:hover:border-red-500/50"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-lg dark:bg-slate-700">
                  <BookOpen size={18} className="text-slate-600 dark:text-slate-300" />
                </div>
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{enrollment.class?.name || 'קורס'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {DAY_MAP[enrollment.class?.day_of_week] || ''} • {enrollment.class?.start_time?.substring(0, 5) || ''}
                    {enrollment.class?.instructor?.full_name && ` • ${enrollment.class.instructor.full_name}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleRemove(enrollment.id)}
                disabled={removingId === enrollment.id}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-all disabled:opacity-50 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 dark:hover:bg-red-500/20"
              >
                {removingId === enrollment.id ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <><XCircle size={14} /> הסר</>
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </BaseModal>
  );
};
