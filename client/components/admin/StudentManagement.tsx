import React, { useState, useEffect, useCallback } from "react";
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
  Loader2
} from "lucide-react";
import { Student, UserRole, EnrollmentStatus } from "../../types/types";
import { supabase } from '../../services/supabaseClient';
import { StudentService, CourseService } from "../../services/api";

// מילון תרגום לסטטוסים
const STATUS_TRANSLATION: Record<EnrollmentStatus, string> = {
  'ACTIVE': 'פעיל',
  'PAUSED': 'מושהה',
  'COMPLETED': 'הושלם',
  'CANCELLED': 'בוטל'
};

const ITEMS_PER_PAGE = 10;

export const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [classList, setClassList] = useState<string[]>([]);

  // State עבור דפדוף וחיפוש
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("הכל");
  const [sortConfig, setSortConfig] = useState<{ key: string; ascending: boolean }>({
    key: 'created_at',
    ascending: false
  });

  // טעינת רשימת השיעורים (עבור ה-Dropdown)
  const fetchClassesList = async () => {
    try {
      // שימוש ב-CourseService כדי למשוך את כל הקורסים הפעילים
      const courses = await CourseService.getAll({ status: 'active' });

      if (courses) {
        // המרה לרשימת שמות ייחודיים
        const uniqueNames = Array.from(new Set(courses.map(c => c.name))).sort();
        setClassList(["הכל", ...uniqueNames]);
      }
    } catch (err) {
      console.error("Failed to load class list", err);
    }
  };

  // פונקציית הטעינה הראשית - צד שרת
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      // קריאה ל-API במקום ל-Supabase
      const response = await StudentService.getAll({
        page,
        limit: ITEMS_PER_PAGE,
        search: searchTerm,
        // selectedClass - API currently doesn't support class filter, adding TODO
        ascending: sortConfig.ascending
      });

      setStudents(response.students);
      setTotalCount(response.count);
    } catch (error) {
      console.error('Error fetching students via API:', error);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, sortConfig, selectedClass]);

  useEffect(() => {
    fetchClassesList();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // טיפול במיון
  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      ascending: current.key === key ? !current.ascending : true
    }));
  };

  const handleExportCSV = () => {
    const headers = ["ID", "שם", "שיעור", "סטטוס", "אימייל", "טלפון", "תאריך הצטרפות"];
    const rows = students.map((student) => [
      student.id, student.full_name, student.enrolledClass || '-', STATUS_TRANSLATION[student.status], student.email, student.phone_number || '-', student.created_at || '-',
    ]);
    const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `students_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: EnrollmentStatus) => {
    switch (status) {
      case 'ACTIVE': return "bg-green-50 text-green-700 border-green-200";
      case 'PAUSED': return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case 'CANCELLED': return "bg-red-50 text-red-700 border-red-200";
      case 'COMPLETED': return "bg-blue-50 text-blue-700 border-blue-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">ניהול תלמידים</h2>
          <p className="text-slate-500">ניהול הרשמות ופרטי תלמידים ({totalCount} רשומות)</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleExportCSV} className="flex items-center gap-2 bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all shadow-sm">
            <Download size={16} /> ייצוא CSV
          </button>
          <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg">
            <Plus size={16} /> הוסף תלמיד
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="חיפוש לפי שם או אימייל..."
            className="w-full pr-10 pl-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
            <Filter size={16} />
            <span>סינון לפי שיעור:</span>
          </div>
          <select
            className="px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
            value={selectedClass}
            onChange={(e) => { setSelectedClass(e.target.value); setPage(0); }}
          >
            {classList.map((c) => (
              <option key={c} value={c}>{c === "הכל" ? "כל השיעורים" : c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th onClick={() => handleSort("full_name")} className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 group">
                  <div className="flex items-center gap-1">תלמיד <ArrowUpDown size={12} className="opacity-50" /></div>
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">שיעור</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">סטטוס</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">פרטי קשר</th>
                <th onClick={() => handleSort("created_at")} className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 group">
                  <div className="flex items-center gap-1">הצטרף <ArrowUpDown size={12} className="opacity-50" /></div>
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-left">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500"><Loader2 className="animate-spin h-6 w-6 mx-auto mb-2" />טוען נתונים...</td></tr>
              ) : students.length > 0 ? (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
// ... (inside map)
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                          {student.profile_image_url ? (
                            <img src={student.profile_image_url} alt="" className="h-10 w-10 rounded-full" />
                          ) : (
                            student.full_name?.charAt(0) || '?'
                          )}
                        </div>
                        <div className="mr-4">
                          <div className="font-medium text-slate-900">{student.full_name}</div>
                          <div className="text-sm text-slate-500">#{student.id.substring(0, 6)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{student.enrolledClass || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(student.status)}`}>
                        {STATUS_TRANSLATION[student.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm text-slate-600"><Mail size={14} className="text-slate-400" />{student.email}</div>
                        <div className="flex items-center gap-2 text-sm text-slate-600"><Phone size={14} className="text-slate-400" />{student.phone_number || '-'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{student.created_at ? new Date(student.created_at).toLocaleDateString('he-IL') : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                      <button className="text-slate-400 hover:text-indigo-600 p-2 rounded-full hover:bg-slate-100 transition-colors"><MoreVertical size={18} /></button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="h-10 w-10 text-slate-300 mb-2" />
                      <p className="font-medium">לא נמצאו תלמידים</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} /> הקודם
          </button>
          <span className="text-sm text-slate-500">
            עמוד {page + 1} מתוך {totalPages || 1}
          </span>
          <button
            onClick={() => setPage(p => (totalPages > p + 1 ? p + 1 : p))}
            disabled={page + 1 >= totalPages}
            className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            הבא <ChevronLeft size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};