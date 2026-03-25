import React, { useState, useEffect, useMemo, useRef } from "react";
import { Helmet } from "react-helmet-async";
import {
  Search,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  Plus,
  ArrowUpDown,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  BookOpen,
  UserMinus,
  Trash2,
} from "lucide-react";
import { Student, EnrollmentStatus } from "../../types/types";
import {
  StudentService,
  CourseService,
  InvitationService,
} from "../../services/api";
import { InviteLinkModal } from "./InviteLinkModal";
import { EnrollStudentModal } from "./EnrollStudentModal";
import { UnenrollStudentModal } from "./UnenrollStudentModal";

// Status translation dictionary
const STATUS_TRANSLATION: Record<EnrollmentStatus, string> = {
  ACTIVE: "פעיל",
  PAUSED: "מושהה",
  COMPLETED: "הושלם",
  CANCELLED: "בוטל",
};

const ITEMS_PER_PAGE = 10;

export const StudentManagement: React.FC = () => {
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [classList, setClassList] = useState<string[]>([]);

  // Pagination and search state
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("הכל");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Student | "created_at";
    ascending: boolean;
  }>({
    key: "created_at",
    ascending: false,
  });

  // Action menu state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Invite modal state
  const [inviteLink, setInviteLink] = useState<string>("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);

  // Enroll/Unenroll modal state
  const [enrollModalStudent, setEnrollModalStudent] = useState<Student | null>(
    null
  );
  const [unenrollModalStudent, setUnenrollModalStudent] =
    useState<Student | null>(null);

  // Delete confirmation state
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(
    null
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // Load list of classes for the dropdown
  const fetchClassesList = async () => {
    try {
      const courses = await CourseService.getAll({ status: "active" });
      if (courses) {
        const uniqueNames = Array.from(
          new Set(courses.map((c) => c.name))
        ).sort();
        setClassList(["הכל", ...uniqueNames]);
      }
    } catch (err) {
      console.error("Failed to load class list", err);
    }
  };

  // Main fetch function
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await StudentService.getAll({ limit: 1000 });
      setAllStudents(response.students);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassesList();
    fetchStudents();
  }, []);

  // Client-side filtering and sorting
  const filteredAndSortedStudents = useMemo(() => {
    let result = [...allStudents];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(
        (student) =>
          student.full_name.toLowerCase().includes(lowerSearch) ||
          student.email.toLowerCase().includes(lowerSearch) ||
          (student.phone_number && student.phone_number.includes(searchTerm))
      );
    }

    if (selectedClass !== "הכל") {
      result = result.filter(
        (student) => student.enrolledClass === selectedClass
      );
    }

    result.sort((a, b) => {
      const aValue = a[sortConfig.key] || "";
      const bValue = b[sortConfig.key] || "";
      if (aValue < bValue) return sortConfig.ascending ? -1 : 1;
      if (aValue > bValue) return sortConfig.ascending ? 1 : -1;
      return 0;
    });

    return result;
  }, [allStudents, searchTerm, selectedClass, sortConfig]);

  // Pagination
  const totalCount = filteredAndSortedStudents.length;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const displayedStudents = filteredAndSortedStudents.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE
  );

  const handleSort = (key: keyof Student | "created_at") => {
    setSortConfig((current) => ({
      key,
      ascending: current.key === key ? !current.ascending : true,
    }));
  };

  const handleExportCSV = () => {
    const headers = [
      "ID",
      "שם",
      "שיעור",
      "סטטוס",
      "אימייל",
      "טלפון",
      "תאריך הצטרפות",
    ];
    const rows = filteredAndSortedStudents.map((student) => [
      student.id,
      student.full_name,
      student.enrolledClass || "-",
      STATUS_TRANSLATION[student.status],
      student.email,
      student.phone_number || "-",
      student.created_at || "-",
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `students_export_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Add Student: generate invitation link ---
  const handleAddStudent = async () => {
    setInviteLoading(true);
    try {
      const result = await InvitationService.create("STUDENT");
      setInviteLink(result.link);
      setShowInviteModal(true);
    } catch (err) {
      console.error("Failed to create student invitation", err);
      alert("שגיאה ביצירת קישור הזמנה");
    } finally {
      setInviteLoading(false);
    }
  };

  // --- Remove student from studio ---
  const handleRemoveFromStudio = async (studentId: string) => {
    if (
      !confirm(
        "האם אתה בטוח שברצונך להסיר תלמיד זה מהסטודיו? פעולה זו אינה ניתנת לביטול."
      )
    )
      return;
    setDeletingStudentId(studentId);
    try {
      await StudentService.delete(studentId);
      setAllStudents((prev) => prev.filter((s) => s.id !== studentId));
    } catch (err) {
      console.error("Failed to remove student", err);
      alert("שגיאה בהסרת התלמיד");
    } finally {
      setDeletingStudentId(null);
      setOpenMenuId(null);
    }
  };

  const getStatusColor = (status: EnrollmentStatus) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-50 text-green-700 border-green-200";
      case "PAUSED":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "CANCELLED":
        return "bg-red-50 text-red-700 border-red-200";
      case "COMPLETED":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>תלמידים | Classly</title>
      </Helmet>
      {/* Modals */}
      <InviteLinkModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        link={inviteLink}
      />
      {enrollModalStudent && (
        <EnrollStudentModal
          isOpen={true}
          onClose={() => setEnrollModalStudent(null)}
          studentId={enrollModalStudent.id}
          studentName={enrollModalStudent.full_name}
          onSuccess={fetchStudents}
        />
      )}
      {unenrollModalStudent && (
        <UnenrollStudentModal
          isOpen={true}
          onClose={() => setUnenrollModalStudent(null)}
          studentId={unenrollModalStudent.id}
          studentName={unenrollModalStudent.full_name}
          onSuccess={fetchStudents}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            ניהול תלמידים
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            ניהול הרשמות ופרטי תלמידים ({totalCount} רשומות)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all shadow-sm dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700"
          >
            <Download size={16} /> ייצוא CSV
          </button>
          <button
            onClick={handleAddStudent}
            disabled={inviteLoading}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {inviteLoading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Plus size={16} />
            )}
            הוסף תלמיד
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center dark:bg-slate-900 dark:border-slate-800">
        <div className="relative w-full md:w-96">
          <Search
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            size={18}
          />
          <input
            type="text"
            placeholder="חיפוש לפי שם או אימייל..."
            className="w-full pr-10 pl-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:placeholder-slate-500"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-slate-500 text-sm font-medium dark:text-slate-400">
            <Filter size={16} />
            <span>סינון לפי שיעור:</span>
          </div>
          <select
            className="px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setPage(0);
            }}
          >
            {classList.map((c) => (
              <option key={c} value={c}>
                {c === "הכל" ? "כל השיעורים" : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 dark:bg-slate-800/50 dark:border-slate-800">
                <th
                  onClick={() => handleSort("full_name")}
                  className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 group dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  <div className="flex items-center gap-1">
                    תלמיד <ArrowUpDown size={12} className="opacity-50" />
                  </div>
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                  שיעור
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                  סטטוס
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                  פרטי קשר
                </th>
                <th
                  onClick={() => handleSort("created_at")}
                  className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 group dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  <div className="flex items-center gap-1">
                    הצטרף <ArrowUpDown size={12} className="opacity-50" />
                  </div>
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-left dark:text-slate-400">
                  פעולות
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-slate-500 dark:text-slate-400"
                  >
                    <Loader2 className="animate-spin h-6 w-6 mx-auto mb-2" />
                    טוען נתונים...
                  </td>
                </tr>
              ) : displayedStudents.length > 0 ? (
                displayedStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50 transition-colors dark:hover:bg-slate-800/50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm dark:bg-indigo-900/50 dark:text-indigo-400">
                          {student.profile_image_url ? (
                            <img
                              src={student.profile_image_url}
                              alt={`תמונת פרופיל של ${student.full_name || "תלמיד"}`}
                              className="h-10 w-10 rounded-full"
                            />
                          ) : (
                            student.full_name?.charAt(0) || "?"
                          )}
                        </div>
                        <div className="mr-4">
                          <div className="font-medium text-slate-900 dark:text-slate-100">
                            {student.full_name}
                          </div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            מזהה: {student.id.substring(0, 6)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                      {student.enrolledClass || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(student.status as EnrollmentStatus)}`}
                      >
                        {STATUS_TRANSLATION[
                          student.status as EnrollmentStatus
                        ] || student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                          <Mail
                            size={14}
                            className="text-slate-400 dark:text-slate-500"
                          />
                          {student.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                          <Phone
                            size={14}
                            className="text-slate-400 dark:text-slate-500"
                          />
                          {student.phone_number || "-"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                      {student.created_at
                        ? new Date(student.created_at).toLocaleDateString(
                            "he-IL"
                          )
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                      <div
                        className="relative"
                        ref={openMenuId === student.id ? menuRef : undefined}
                      >
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenMenuId(
                              openMenuId === student.id ? null : student.id
                            );
                          }}
                          className="text-slate-400 hover:text-indigo-600 p-2 rounded-full hover:bg-slate-100 transition-colors dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-slate-800"
                        >
                          <MoreVertical size={18} />
                        </button>

                        {/* Dropdown Menu / Bottom Sheet */}
                        {openMenuId === student.id && (
                          <>
                            {/* Mobile Backdrop */}
                            <div
                              className="fixed inset-0 z-40 sm:hidden"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(null);
                              }}
                            />
                            <div
                              className="absolute left-0 top-full mt-1 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 animate-fadeIn dark:bg-slate-800 dark:border-slate-700 max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:w-full max-sm:top-auto max-sm:rounded-t-2xl max-sm:rounded-b-none max-sm:mt-0 max-sm:border-x-0 max-sm:border-b-0 max-sm:shadow-[0_-8px_30px_rgba(0,0,0,0.12)] max-sm:pb-6"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => {
                                  setEnrollModalStudent(student);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-right px-4 py-3 sm:py-2.5 text-sm sm:text-base text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-3 sm:gap-2 transition-colors dark:text-slate-300 dark:hover:bg-slate-700/50 dark:hover:text-indigo-400"
                              >
                                <BookOpen
                                  size={16}
                                  className="sm:w-[15px] sm:h-[15px]"
                                />
                                רישום לקורסים
                              </button>
                              <button
                                onClick={() => {
                                  setUnenrollModalStudent(student);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-right px-4 py-3 sm:py-2.5 text-sm sm:text-base text-slate-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-3 sm:gap-2 transition-colors dark:text-slate-300 dark:hover:bg-slate-700/50 dark:hover:text-orange-400"
                              >
                                <UserMinus
                                  size={16}
                                  className="sm:w-[15px] sm:h-[15px]"
                                />
                                הסרה מקורסים
                              </button>
                              <div className="border-t border-slate-100 my-1 dark:border-slate-700" />
                              <button
                                onClick={() =>
                                  handleRemoveFromStudio(student.id)
                                }
                                disabled={deletingStudentId === student.id}
                                className="w-full text-right px-4 py-3 sm:py-2.5 text-sm sm:text-base text-red-600 hover:bg-red-50 flex items-center gap-3 sm:gap-2 transition-colors disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-500/10"
                              >
                                {deletingStudentId === student.id ? (
                                  <Loader2
                                    className="animate-spin sm:w-[15px] sm:h-[15px]"
                                    size={16}
                                  />
                                ) : (
                                  <Trash2
                                    size={16}
                                    className="sm:w-[15px] sm:h-[15px]"
                                  />
                                )}
                                הסרה מהסטודיו
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <Search className="h-10 w-10 text-slate-300 mb-2" />
                      <p className="font-medium">
                        {searchTerm
                          ? "לא נמצאו תוצאות לחיפוש זה"
                          : "לא נמצאו תלמידים"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between dark:bg-slate-800/50 dark:border-slate-800">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed dark:text-slate-400 dark:hover:text-indigo-400"
          >
            <ChevronRight size={16} /> הקודם
          </button>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            עמוד {page + 1} מתוך {totalPages || 1}
          </span>
          <button
            onClick={() => setPage((p) => (totalPages > p + 1 ? p + 1 : p))}
            disabled={page + 1 >= totalPages}
            className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed dark:text-slate-400 dark:hover:text-indigo-400"
          >
            הבא <ChevronLeft size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
