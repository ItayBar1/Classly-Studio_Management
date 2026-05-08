import React, { useEffect, useState } from "react";
import { Search, Filter, Loader2 } from "lucide-react";
import { CourseService, EnrollmentService } from "../../services/api";
import { ClassCard } from "../common/ClassCard";
import { RegistrationModal } from "./RegistrationModal";
import { ClassSession } from "../../types/types";
import { DAY_MAP, extractTime } from "../../utils/dateUtils";

export const BrowseCourses: React.FC = () => {
  const [courses, setCourses] = useState<ClassSession[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]); // State to store enrolled course IDs
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<ClassSession | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      // Fetch courses and enrollments concurrently
      const [coursesData, enrollmentsData] = await Promise.all([
        CourseService.getAll({ status: "active" }),
        EnrollmentService.getMyEnrollments(),
      ]);

      const mappedCourses = coursesData.map((cls: any) => ({
        id: cls.id,
        name: cls.name,
        dayName: DAY_MAP[cls.day_of_week] || "",
        instructor: cls.instructor?.full_name || "מדריך לא ידוע",
        startTime: extractTime(cls.start_time),
        endTime: extractTime(cls.end_time),
        duration: cls.duration || 60,
        students: cls.current_enrollment || 0,
        capacity: cls.max_capacity || 20,
        level: cls.level || "ALL_LEVELS",
        room: cls.location_room || "סטודיו ראשי",
        color: cls.color || "indigo",
        description: cls.description,
        price_ils: cls.price_ils,
        categoryName: cls.category?.name,
        original: cls
      }));

      setCourses(mappedCourses);

      // Extract IDs of courses the user is already enrolled in
      const userCourseIds = enrollmentsData
        .map((e: any) => e.class_id || e.class?.id)
        .filter(Boolean);
      setEnrolledCourseIds(userCourseIds);
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleRegisterClick = (course: ClassSession) => {
    setSelectedCourse(course);
    setIsModalOpen(true);
  };

  const filteredCourses = courses.filter(
    (course) =>
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.description &&
        course.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">הרשמה לחוגים</h2>
          <p className="text-slate-500">מצא את החוג הבא שלך והירשם בקלות</p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="חפש חוג..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20 text-slate-400">
          <Loader2 className="animate-spin mr-2" /> טוען חוגים...
        </div>
      ) : filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div key={course.id} className="relative h-full">
              <ClassCard
                session={course}
                isStudent={true}
                onRegister={handleRegisterClick}
                isEnrolled={enrolledCourseIds.includes(course.id)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-200">
          <p className="text-slate-500">לא נמצאו חוגים התואמים את החיפוש.</p>
        </div>
      )}

      {/* Modal */}
      <RegistrationModal
        course={selectedCourse}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchCourses(); // Refresh data to also update the enrollment list
        }}
      />
    </div>
  );
};
