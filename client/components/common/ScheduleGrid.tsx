import React from "react";
import { ClassSession } from "../../types/types";

export interface ScheduleColumn {
  id: string | number;
  name: string;
  icon?: React.ReactNode;
  classes: ClassSession[];
}

interface ScheduleGridProps {
  columns: ScheduleColumn[];
  startHour: number;
  endHour: number;
  renderClassCard: (cls: ClassSession) => React.ReactNode;
}

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  columns,
  startHour,
  endHour,
  renderClassCard,
}) => {
  const PIXELS_PER_MINUTE = 2; // 120px per hour
  const HOUR_HEIGHT = 60 * PIXELS_PER_MINUTE;

  const getTopOffset = (startTimeStr: string) => {
    const [h, m] = startTimeStr.split(":").map(Number);
    const totalMinutes = h * 60 + m;
    const startOfDayMinutes = startHour * 60;
    return (totalMinutes - startOfDayMinutes) * PIXELS_PER_MINUTE;
  };

  const getHeight = (durationMins: number) => {
    return durationMins * PIXELS_PER_MINUTE;
  };

  return (
    <div className="flex bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden relative shadow-sm h-[800px]">
      {/* Single scrolling container for both X and Y */}
      <div className="flex-1 overflow-auto relative scrollbar-hide">
        <div className="flex min-w-full">
          {/* Time Axis - Sticky to right */}
          <div className="w-16 flex-shrink-0 bg-slate-50 dark:bg-slate-800/50 border-l border-slate-200 dark:border-slate-700 sticky right-0 z-40 shadow-[1px_0_5px_rgba(0,0,0,0.05)]">
            <div className="h-12 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-slate-50 dark:bg-slate-800/50 z-50"></div>
            <div
              className="relative w-full"
              style={{ height: (endHour - startHour) * HOUR_HEIGHT }}
            >
              {Array.from({ length: endHour - startHour + 1 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-full text-center text-xs text-slate-500 font-medium"
                  style={{ top: i * HOUR_HEIGHT - 8 }}
                >
                  {String(startHour + i).padStart(2, "0")}:00
                </div>
              ))}
            </div>
          </div>

          {/* Columns */}
          <div className="flex flex-1 min-w-max">
            {columns.map((col) => (
              <div
                key={col.id}
                className="flex-1 min-w-[250px] border-l last:border-l-0 border-slate-200 dark:border-slate-800 relative bg-white dark:bg-slate-900"
              >
                {/* Column Header - sticky */}
                <div className="h-12 sticky top-0 bg-slate-50 dark:bg-slate-800/90 backdrop-blur-sm z-30 border-b border-slate-200 dark:border-slate-700 flex items-center justify-center font-semibold text-sm text-slate-800 dark:text-slate-200 shadow-sm">
                  {col.icon && <span className="mr-1">{col.icon}</span>}
                  {col.name}
                  <span className="text-[10px] bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded-full text-slate-500 shadow-sm mr-2">
                    {col.classes.length}
                  </span>
                </div>

                {/* Grid lines & Classes */}
                <div
                  className="relative"
                  style={{ height: (endHour - startHour) * HOUR_HEIGHT }}
                >
                  {/* Horizontal Grid lines */}
                  {Array.from({ length: endHour - startHour }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-full border-t border-slate-100 dark:border-slate-800/50"
                      style={{ top: i * HOUR_HEIGHT }}
                    ></div>
                  ))}

                  {/* Half-hour Grid lines (dashed) */}
                  {Array.from({ length: endHour - startHour }).map((_, i) => (
                    <div
                      key={`half-${i}`}
                      className="absolute w-full border-t border-dashed border-slate-100 dark:border-slate-800/30"
                      style={{ top: i * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
                    ></div>
                  ))}

                  {/* Classes */}
                  {col.classes.map((cls) => (
                    <div
                      key={cls.id}
                      className="absolute left-2 right-2 p-1 group transition-all"
                      style={{
                        top: getTopOffset(cls.startTime),
                        height: getHeight(cls.duration),
                      }}
                    >
                      {renderClassCard(cls)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
