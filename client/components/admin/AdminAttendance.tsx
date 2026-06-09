import React, { useEffect, useMemo, useState } from "react";
import {
  AttendanceService,
  BranchService,
  RoomService,
  CourseService,
  StudentService,
  UserService,
} from "../../services/api";
import { PageHeader } from "../common/PageHeader";
import { FormSelect } from "../common/FormFields";
import { AttendanceSections } from "../common/AttendanceSections";
import { AttendanceModal } from "../common/AttendanceModal";
import { DateRangeFilter } from "../common/DateRangeFilter";
import { AttendanceItem, OverviewMode } from "../common/attendanceUtils";
import { ClipboardList, Filter, X } from "lucide-react";
import toast from "react-hot-toast";

interface Filters {
  branchId: string;
  instructorId: string;
  classId: string;
  roomId: string;
  studentId: string;
  from: string;
  to: string;
}

const EMPTY_FILTERS: Filters = {
  branchId: "",
  instructorId: "",
  classId: "",
  roomId: "",
  studentId: "",
  from: "",
  to: "",
};

type Option = { value: string | number; label: string };
const ALL: Option = { value: "", label: "הכל" };

export const AdminAttendance: React.FC = () => {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [mode, setMode] = useState<OverviewMode>("session");
  const [items, setItems] = useState<AttendanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AttendanceItem | null>(null);

  // Filter option lists
  const [branches, setBranches] = useState<Option[]>([]);
  const [instructors, setInstructors] = useState<Option[]>([]);
  const [classes, setClasses] = useState<Option[]>([]);
  const [rooms, setRooms] = useState<Option[]>([]);
  const [students, setStudents] = useState<Option[]>([]);

  // Load filter options once.
  useEffect(() => {
    (async () => {
      try {
        const [branchList, instructorList, classList, roomList, studentList] =
          await Promise.all([
            BranchService.getAll(),
            UserService.getInstructors(),
            CourseService.getAll(),
            RoomService.getAll(),
            StudentService.getAll({ limit: 1000 }),
          ]);
        setBranches(branchList.map((b) => ({ value: b.id, label: b.name })));
        setInstructors(
          instructorList.map((i) => ({ value: i.id, label: i.full_name }))
        );
        setClasses(classList.map((c) => ({ value: c.id, label: c.name })));
        setRooms(roomList.map((r) => ({ value: r.id, label: r.name })));
        setStudents(
          studentList.students.map((s) => ({ value: s.id, label: s.full_name }))
        );
      } catch (error) {
        console.error("Failed to load filter options", error);
        toast.error("שגיאה בטעינת אפשרויות הסינון");
      }
    })();
  }, []);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      // Strip empty values so they aren't sent as query params.
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== "")
      );
      const res = await AttendanceService.getStudioOverview(params);
      setMode(res.mode);
      setItems(res.items);
    } catch (error) {
      console.error("Failed to fetch attendance overview", error);
      toast.error("שגיאה בטעינת נתוני הנוכחות");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const setFilter = (key: keyof Filters) => (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => setFilters((prev) => ({ ...prev, [key]: e.target.value }));

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some((v) => v !== ""),
    [filters]
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      <PageHeader
        title="נוכחות"
        subtitle="מעקב אחר דיווחי נוכחות בכל הסטודיו"
        icon={
          <ClipboardList
            size={28}
            className="text-indigo-600 dark:text-indigo-400"
          />
        }
      />

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-200">
            <Filter size={18} className="text-indigo-500" />
            סינון
          </h3>
          {hasActiveFilters && (
            <button
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400"
            >
              <X size={15} />
              נקה סינון
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <FormSelect
            label="סניף"
            value={filters.branchId}
            onChange={setFilter("branchId")}
            options={[ALL, ...branches]}
          />
          <FormSelect
            label="מדריך"
            value={filters.instructorId}
            onChange={setFilter("instructorId")}
            options={[ALL, ...instructors]}
          />
          <FormSelect
            label="חדר"
            value={filters.roomId}
            onChange={setFilter("roomId")}
            options={[ALL, ...rooms]}
          />
          <FormSelect
            label="חוג"
            value={filters.classId}
            onChange={setFilter("classId")}
            options={[ALL, ...classes]}
          />
          <FormSelect
            label="תלמיד"
            value={filters.studentId}
            onChange={setFilter("studentId")}
            options={[ALL, ...students]}
          />
          <DateRangeFilter
            from={filters.from}
            to={filters.to}
            onChange={(r) =>
              setFilters((prev) => ({ ...prev, from: r.from, to: r.to }))
            }
          />
        </div>
      </div>

      {/* Overview */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
          {mode === "student" ? "נוכחות התלמיד" : "סקירת נוכחות"}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          {mode === "student"
            ? "השיעורים מסומנים לפי נוכחות התלמיד שנבחר: נוכח / איחור / נעדר."
            : "השיעורים מקובצים לפי סניף ומדריך, ומסומנים לפי סטטוס הדיווח."}
        </p>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <AttendanceSections
            items={items}
            mode={mode}
            grouped={mode === "session"}
            onSelect={setSelected}
            emptyText="לא נמצאו שיעורים התואמים לסינון."
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
          onSaved={() => fetchOverview()}
        />
      )}
    </div>
  );
};
