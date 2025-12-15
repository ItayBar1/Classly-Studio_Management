import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  Plus,
  ArrowUpDown,
  Download,
} from "lucide-react";
import { Student } from "../types/types";
import { supabase } from '../services/supabaseClient';

export const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("All");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Student;
    direction: "asc" | "desc";
  } | null>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      // שליפה מטבלת users (לפי ה-PRD שלך, סטודנטים הם users עם role='STUDENT')
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'STUDENT');

      if (error) throw error;

      if (data) {
        // המרה למבנה של ה-Student Interface שלך במידת הצורך
        // שים לב: ב-PRD שמות העמודות הם ב-snake_case (למשל full_name) ובקוד שלך ב-camelCase
        const formattedStudents = data.map(user => ({
            id: user.id,
            name: user.full_name,
            role: user.role,
            avatar: user.full_name ? user.full_name[0].toUpperCase() : '?',
            email: user.email,
            phone: user.phone_number,
            enrolledClass: 'Unknown', // זה ידרוש שליפה מורכבת יותר מטבלת enrollments
            status: user.status,
            joinDate: user.created_at
        }));
        setStudents(formattedStudents as any); // Type assertion זמני
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  // Extract unique classes for filter and sort them alphabetically
  const classes = useMemo(() => {
    const uniqueClasses = Array.from(
      new Set(students.map((s) => s.enrolledClass))
    );
    return ["All", ...uniqueClasses.sort()];
  }, []);

  // Filter and Sort
  const processedStudents = useMemo(() => {
    let filtered = students.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClass =
        selectedClass === "All" || student.enrolledClass === selectedClass;
      return matchesSearch && matchesClass;
    });

    if (sortConfig) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key])
          return sortConfig.direction === "asc" ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key])
          return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [searchTerm, selectedClass, sortConfig]);

  const handleSort = (key: keyof Student) => {
    setSortConfig((current) => ({
      key,
      direction:
        current?.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Name",
      "Class",
      "Status",
      "Email",
      "Phone",
      "Join Date",
    ];

    const rows = processedStudents.map((student) => [
      student.id,
      student.name,
      student.enrolledClass,
      student.status,
      student.email,
      student.phone,
      student.joinDate,
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
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Student Management
          </h2>
          <p className="text-slate-500">
            Manage enrollments and student details
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm"
          >
            <Download size={16} />
            Export CSV
          </button>
          <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg">
            <Plus size={16} />
            Add Student
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
            <Filter size={16} />
            <span>Filter by Class:</span>
          </div>
          <select
            className="px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            {classes.map((c) => (
              <option key={c} value={c}>
                {c === "All" ? "All Classes" : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th
                  onClick={() => handleSort("name")}
                  className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 group"
                >
                  <div className="flex items-center gap-1">
                    Student
                    <ArrowUpDown
                      size={12}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("enrolledClass")}
                  className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 group"
                >
                  <div className="flex items-center gap-1">
                    Class
                    <ArrowUpDown
                      size={12}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("status")}
                  className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 group"
                >
                  <div className="flex items-center gap-1">
                    Status
                    <ArrowUpDown
                      size={12}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Contact
                </th>
                <th
                  onClick={() => handleSort("joinDate")}
                  className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 group"
                >
                  <div className="flex items-center gap-1">
                    Joined
                    <ArrowUpDown
                      size={12}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {processedStudents.length > 0 ? (
                processedStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                          {student.avatar}
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-slate-900">
                            {student.name}
                          </div>
                          <div className="text-sm text-slate-500">
                            ID: #{student.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {student.enrolledClass}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${
                          student.status === "Active"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : student.status === "Pending"
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Mail size={14} className="text-slate-400" />
                          {student.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone size={14} className="text-slate-400" />
                          {student.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {new Date(student.joinDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-slate-400 hover:text-indigo-600 p-2 rounded-full hover:bg-slate-100 transition-colors">
                        <MoreVertical size={18} />
                      </button>
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
                      <p className="font-medium">No students found</p>
                      <p className="text-sm">
                        Try adjusting your search or filters
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
