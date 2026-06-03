import React, { useEffect, useState } from "react";
import { CourseService } from "../../services/api";
import { Loader2, Calendar } from "lucide-react";
import { ClassCard } from "../common/ClassCard";
import { ScheduleGrid, ScheduleColumn } from "../common/ScheduleGrid";
import { DAYS_ARRAY, extractTime } from "../../utils/dateUtils";
import { PageHeader } from "../common/PageHeader";
import { BaseModal } from "../common/BaseModal";
import { ColorMapper } from "../../utils/colorUtils";
import { Filter } from "lucide-react";

export const InstructorSchedule: React.FC = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startHour, setStartHour] = useState(7);
  const [endHour, setEndHour] = useState(23);
  const [selectedViewClass, setSelectedViewClass] = useState<any | null>(null);

  const [filterBranch, setFilterBranch] = useState("all");
  const [filterRoom, setFilterRoom] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");

  useEffect(() => {
    const fetchMySchedule = async () => {
      try {
        const data = await CourseService.getInstructorCourses();
        console.log("Instructor Schedule Data:", data);

        if (data && data.length > 0) {
          const colorMapper = new ColorMapper();

          let minHour = 24;
          let maxHour = 0;

          const formatted = data.map((cls: any) => {
            const startTimeStr = extractTime(cls.start_time || cls.startTime);
            const endTimeStr = extractTime(cls.end_time || cls.endTime);

            // Calculate min and max hour
            const startH = parseInt(startTimeStr.split(":")[0]);
            const endH = parseInt(endTimeStr.split(":")[0]) + 1; // +1 to give padding
            if (startH < minHour) minHour = startH;
            if (endH > maxHour) maxHour = endH;

            const duration = Math.round(
              (new Date(`1970-01-01T${endTimeStr}:00.000Z`).getTime() -
                new Date(`1970-01-01T${startTimeStr}:00.000Z`).getTime()) /
                60000
            );

            // Assign Colors
            const branchId = cls.branch_id || "default";
            const roomName = cls.location_room || "לא צוין";
            const branchName = cls.branch?.name || "סניף";

            return {
              id: cls.id,
              name: cls.name,
              instructor: `${branchName} - ${roomName}`,
              startTime: startTimeStr,
              endTime: endTimeStr,
              duration: duration,
              dayOfWeek: cls.day_of_week,
              dayName: DAYS_ARRAY[cls.day_of_week],
              students: cls.current_enrollment || 0,
              capacity: cls.max_capacity,
              level: cls.level,
              room: roomName,
              branchName: branchName,
              bgColor: colorMapper.getBranchColor(branchId),
              sideColor: colorMapper.getRoomColor(roomName),
              categoryName: cls.category?.name,
            };
          });

          // Ensure reasonable bounds
          if (minHour > maxHour) {
            minHour = 7;
            maxHour = 23;
          } else {
            // Add a bit of padding if possible
            if (minHour > 0) minHour -= 1;
            if (maxHour < 24) maxHour += 1;
          }

          setStartHour(minHour);
          setEndHour(maxHour);
          setClasses(formatted);
        }
      } catch (err) {
        console.error("Error fetching schedule:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMySchedule();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const filteredClasses = classes.filter(cls => {
    if (filterBranch !== "all" && cls.branchName !== filterBranch) return false;
    if (filterRoom !== "all" && cls.room !== filterRoom) return false;
    if (filterLevel !== "all" && cls.level !== filterLevel) return false;
    return true;
  });

  // Unique values for filters
  const uniqueBranches = Array.from(new Set(classes.map(c => c.branchName))).filter(Boolean);
  const uniqueRooms = Array.from(new Set(classes.map(c => c.room))).filter(Boolean);
  const uniqueLevels = Array.from(new Set(classes.map(c => c.level))).filter(Boolean);

  // Create columns based on days of the week
  const columns: ScheduleColumn[] = DAYS_ARRAY.map((dayName, index) => ({
    id: index,
    name: dayName,
    classes: filteredClasses.filter((cls) => cls.dayOfWeek === index),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="מערכת השעות שלי"
        subtitle="מבט שבועי על השיעורים שלך"
      />

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center text-slate-500 gap-2">
          <Filter size={18} />
          <span className="font-medium text-sm">סינון:</span>
        </div>
        
        <select
          value={filterBranch}
          onChange={e => setFilterBranch(e.target.value)}
          className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
        >
          <option value="all">כל הסניפים</option>
          {uniqueBranches.map(b => <option key={b} value={b}>{b}</option>)}
        </select>

        <select
          value={filterRoom}
          onChange={e => setFilterRoom(e.target.value)}
          className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
        >
          <option value="all">כל החדרים</option>
          {uniqueRooms.map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        <select
          value={filterLevel}
          onChange={e => setFilterLevel(e.target.value)}
          className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
        >
          <option value="all">כל הרמות</option>
          {uniqueLevels.map(l => <option key={l} value={l}>{l === 'BEGINNER' ? 'מתחילים' : l === 'INTERMEDIATE' ? 'בינוניים' : l === 'ADVANCED' ? 'מתקדמים' : l}</option>)}
        </select>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
        {filteredClasses.length > 0 ? (
          <ScheduleGrid
            columns={columns}
            startHour={startHour}
            endHour={endHour}
            renderClassCard={(cls) => (
              <ClassCard 
                session={cls} 
                isCompact={true} 
                onClick={() => setSelectedViewClass(cls)}
              />
            )}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 bg-slate-50 dark:bg-slate-900/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-sm mb-4">
              <Calendar className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              לא נמצאו שיעורים
            </h3>
            <p className="text-slate-500 max-w-sm mt-1">
              עדיין לא שובצת לשיעורים במערכת.
            </p>
          </div>
        )}
      </div>

      <BaseModal
        isOpen={!!selectedViewClass}
        onClose={() => setSelectedViewClass(null)}
        title="פרטי שיעור"
        maxWidth="max-w-md"
      >
        {selectedViewClass && (
          <div className="pt-2">
            <ClassCard
              session={selectedViewClass}
              isInstructor={true}
              isCompact={false}
            />
          </div>
        )}
      </BaseModal>
    </div>
  );
};
