import axios from "axios";
import { supabase } from "./supabaseClient";
import { 
  User, 
  Student, 
  ClassSession, 
  PaymentRecord, 
  DashboardStats, 
  InstructorStats 
} from "../types/types";

// הגדרת כתובת ה-API
const API_URL = import.meta.env.VITE_API_URL;

// יצירת מופע Axios
export const apiClient = axios.create({
  baseURL: API_URL, // וודא ש-VITE_API_URL כולל את ה-suffix '/api' אם צריך (למשל http://localhost:5000/api)
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor: הוספת טוקן Auth של Supabase לכל בקשה
apiClient.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// --- Services ---

export const UserService = {
  // שליפת המשתמש הנוכחי
  getMe: () => apiClient.get<User>('/users/me').then(res => res.data),
  
  // שליפת כל המדריכים
  getInstructors: () => apiClient.get<User[]>('/instructors').then(res => res.data),
};

// --- NEW: Student Service (נוסף כדי לתמוך במחיקה וניהול תלמידים) ---
export const StudentService = {
  // שליפת כל התלמידים (Admin)
  getAll: () => apiClient.get<Student[]>('/students').then(res => res.data),

  // הוספת תלמיד ידנית
  create: (data: Partial<Student>) => apiClient.post('/students', data).then(res => res.data),

  // מחיקת תלמיד (Soft Delete) - התוספת החדשה
  delete: (id: string) => apiClient.delete(`/students/${id}`).then(res => res.data),
};

export const CourseService = {
  // שליפת כל הקורסים
  getAll: () => apiClient.get<ClassSession[]>('/courses').then(res => res.data),
  
  // יצירת קורס חדש
  create: (data: Partial<ClassSession>) => apiClient.post<ClassSession>('/courses', data).then(res => res.data),
  
  // עדכון קורס - תוקן ל-PATCH
  update: (id: string, data: Partial<ClassSession>) => apiClient.patch<ClassSession>(`/courses/${id}`, data).then(res => res.data),
  
  // מחיקת קורס
  delete: (id: string) => apiClient.delete(`/courses/${id}`).then(res => res.data),

  // שליפת הקורסים של המדריך המחובר
  getInstructorCourses: () => apiClient.get<ClassSession[]>('/courses/my-courses').then(res => res.data),

  // שליפת הקורסים הפנויים להרשמה (עבור ה-Browse Courses)
  getAvailableCourses: () => apiClient.get<ClassSession[]>('/courses/available').then(res => res.data),
};

export const EnrollmentService = {
  // --- תוקן: שימוש בנתיבים הנכונים מול השרת ---

  // הרשמה לקורס (Student Action) - תוקן מ-/courses/enroll
  register: (courseId: string) => apiClient.post('/enrollments/register', { courseId }).then(res => res.data),

  // שליפת הקורסים שהתלמיד רשום אליהם - תוקן מ-/courses/enrolled
  getMyEnrollments: () => apiClient.get<any[]>('/enrollments/my-enrollments').then(res => res.data),
  
  // שליפת נרשמים לקורס ספציפי (עבור מדריך/אדמין)
  getClassEnrollments: (classId: string) => apiClient.get<any[]>(`/enrollments/class/${classId}`).then(res => res.data),
};

export const PaymentService = {
  // הערה: נתיב זה חסר בשרת כרגע, יש לוודא מימוש ב-payments.ts
  getAll: () => apiClient.get<PaymentRecord[]>('/payments').then(res => res.data),
  
  // יצירת כוונת תשלום
  createIntent: (data: { amount: number; currency?: string; description?: string }) => 
    apiClient.post<{ clientSecret: string }>('/payment/create-intent', data).then(res => res.data),
};

export const DashboardService = {
  getAdminStats: () => apiClient.get<DashboardStats>('/dashboard/admin').then(res => res.data),
  getInstructorStats: () => apiClient.get<InstructorStats>('/dashboard/instructor').then(res => res.data),
};