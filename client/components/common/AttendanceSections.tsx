import React, { useMemo, useState, useEffect } from "react";
import { ChevronDown, Building2, User, Lock } from "lucide-react";
import {
  AttendanceItem,
  AttendanceBucket,
  OverviewMode,
  classifyAttendance,
  sectionsFor,
  BUCKET_THEME,
  formatAttendanceDate,
  attendanceItemKey,
  isAttendanceOpen,
  ATTENDANCE_LEAD_MINUTES,
} from "./attendanceUtils";

interface AttendanceSectionsProps {
  items: AttendanceItem[];
  mode: OverviewMode;
  /** Group items by branch → instructor inside each open section (manager view). */
  grouped?: boolean;
  onSelect?: (item: AttendanceItem) => void;
  emptyText?: string;
}

const BUCKET_ORDER: AttendanceBucket[] = ["red", "yellow", "green"];

/** A single clickable session/record card. */
const AttendanceCard: React.FC<{
  item: AttendanceItem;
  badge: string;
  bucket: AttendanceBucket;
  index: number;
  onSelect?: (item: AttendanceItem) => void;
}> = ({ item, badge, bucket, index, onSelect }) => {
  const theme = BUCKET_THEME[bucket];
  // Attendance is only fillable from 15 min before the class; future sessions lock.
  const locked = !isAttendanceOpen(item);
  const clickable = !!onSelect && !locked;
  return (
    <div
      onClick={clickable ? () => onSelect!(item) : undefined}
      className={`p-4 rounded-xl border bg-white dark:bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all ${
        clickable ? "cursor-pointer hover:shadow-md" : ""
      } ${locked ? "opacity-70" : ""} ${theme.card}`}
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-base text-slate-800 dark:text-slate-200">
            {item.className}
          </span>
          {item.roomName && (
            <span className="text-sm font-medium text-slate-500">
              ({item.roomName})
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
          <span>{formatAttendanceDate(item.date)}</span>
          <span>•</span>
          <span>
            {item.startTime} - {item.endTime}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
        {locked && (
          <span
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
            title={`ניתן לדווח נוכחות החל מ-${ATTENDANCE_LEAD_MINUTES} דקות לפני תחילת השיעור`}
          >
            <Lock size={13} />
            ננעל
          </span>
        )}
        <span
          className={`px-3 py-1.5 rounded-full text-sm font-bold ${theme.badge}`}
        >
          {badge}
        </span>
      </div>
    </div>
  );
};

interface BucketedItem {
  item: AttendanceItem;
  badge: string;
  index: number;
}

/** Group a bucket's items by branch, then by instructor. */
function groupByBranchInstructor(entries: BucketedItem[]) {
  const branches = new Map<
    string,
    Map<string, BucketedItem[]>
  >();
  for (const entry of entries) {
    const branch = entry.item.branchName || "סניף ראשי";
    const instructor = entry.item.instructorName || "מדריך";
    if (!branches.has(branch)) branches.set(branch, new Map());
    const byInstructor = branches.get(branch)!;
    if (!byInstructor.has(instructor)) byInstructor.set(instructor, []);
    byInstructor.get(instructor)!.push(entry);
  }
  return Array.from(branches.entries()).map(([branchName, byInstructor]) => ({
    branchName,
    instructors: Array.from(byInstructor.entries()).map(
      ([instructorName, items]) => ({ instructorName, items })
    ),
  }));
}

export const AttendanceSections: React.FC<AttendanceSectionsProps> = ({
  items,
  mode,
  grouped = false,
  onSelect,
  emptyText = "לא נמצאו שיעורים",
}) => {
  const sections = sectionsFor(mode);

  // Partition items into colour buckets once.
  const buckets = useMemo(() => {
    const map: Record<AttendanceBucket, BucketedItem[]> = {
      green: [],
      yellow: [],
      red: [],
    };
    items.forEach((item, index) => {
      const { bucket, badge } = classifyAttendance(item, mode);
      map[bucket].push({ item, badge, index });
    });
    return map;
  }, [items, mode]);

  const firstNonEmpty = useMemo(
    () => BUCKET_ORDER.find((b) => buckets[b].length > 0) ?? null,
    [buckets]
  );

  const [open, setOpen] = useState<AttendanceBucket | null>(firstNonEmpty);

  // Keep the open section valid as filters change.
  useEffect(() => {
    setOpen((current) =>
      current && buckets[current].length > 0 ? current : firstNonEmpty
    );
  }, [firstNonEmpty, buckets]);

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sections.map((section) => {
        const entries = buckets[section.bucket];
        const theme = BUCKET_THEME[section.bucket];
        const isOpen = open === section.bucket;
        return (
          <div
            key={section.bucket}
            className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            <button
              onClick={() =>
                setOpen((cur) => (cur === section.bucket ? null : section.bucket))
              }
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 font-bold border-b transition-colors ${theme.header} ${
                isOpen ? "" : "border-transparent"
              }`}
            >
              <span className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${theme.dot}`} />
                {section.title}
                <span className="text-sm font-medium opacity-80">
                  ({entries.length})
                </span>
              </span>
              <ChevronDown
                size={20}
                className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isOpen && (
              <div className="p-4 bg-white dark:bg-slate-900">
                {entries.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-sm">
                    אין פריטים בקטגוריה זו
                  </div>
                ) : grouped ? (
                  <div className="space-y-6">
                    {groupByBranchInstructor(entries).map((branch) => (
                      <div key={branch.branchName} className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 pb-1.5">
                          <Building2 size={18} className="text-indigo-500" />
                          {branch.branchName}
                        </div>
                        {branch.instructors.map((inst) => (
                          <div key={inst.instructorName} className="space-y-2 pr-2">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                              <User size={15} />
                              {inst.instructorName}
                            </div>
                            <div className="space-y-2">
                              {inst.items.map((e) => (
                                <AttendanceCard
                                  key={attendanceItemKey(e.item, e.index)}
                                  item={e.item}
                                  badge={e.badge}
                                  bucket={section.bucket}
                                  index={e.index}
                                  onSelect={onSelect}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {entries.map((e) => (
                      <AttendanceCard
                        key={attendanceItemKey(e.item, e.index)}
                        item={e.item}
                        badge={e.badge}
                        bucket={section.bucket}
                        index={e.index}
                        onSelect={onSelect}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
