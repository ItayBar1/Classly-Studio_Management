import axios from "axios";
import {
  User,
  Student,
  ClassSession,
  PaymentRecord,
  DashboardStats,
  InstructorStats,
  Studio,
  Branch,
  Room
} from "../types/types";

// הגדרת כתובת ה-API
const API_URL = import.meta.env.VITE_API_URL;

// Token management utilities
const TOKEN_KEY = 'classly_auth_token';

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeStoredToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

// User data stored alongside token for quick access
const USER_KEY = 'classly_user';

export const getStoredUser = (): User | null => {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const setStoredUser = (user: User): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const removeStoredUser = (): void => {
  localStorage.removeItem(USER_KEY);
};

// יצירת מופע Axios
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor: הוספת טוקן JWT מ-localStorage לכל בקשה
apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Auth endpoints that should NOT trigger auto-logout on 401
const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];

// Interceptor: Handle 401 responses (expired/invalid token)
// Skip auto-logout for auth endpoints — let the calling code handle the error
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || '';
      const isAuthRequest = AUTH_PATHS.some((path) => requestUrl.includes(path));

      if (!isAuthRequest) {
        // Token expired on a protected route — logout and reload
        removeStoredToken();
        removeStoredUser();
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

// --- Auth Service ---
export const AuthService = {
  login: async (email: string, password: string) => {
    const res = await apiClient.post<{ token: string; user: User }>('/auth/login', { email, password });
    setStoredToken(res.data.token);
    setStoredUser(res.data.user);
    return res.data;
  },

  register: async (data: {
    email: string;
    password: string;
    full_name?: string;
    phone_number?: string;
    studio_serial?: string;
    invitationToken?: string;
  }) => {
    const res = await apiClient.post<{ token: string; user: User; message: string }>('/auth/register', data);
    setStoredToken(res.data.token);
    setStoredUser(res.data.user);
    return res.data;
  },

  forgotPassword: async (email: string) => {
    const res = await apiClient.post<{ message: string }>('/auth/forgot-password', { email });
    return res.data;
  },

  logout: () => {
    removeStoredToken();
    removeStoredUser();
  },

  isAuthenticated: (): boolean => {
    return !!getStoredToken();
  },

  getCurrentUser: (): User | null => {
    return getStoredUser();
  },
};

// --- Services ---

export const UserService = {
  // שליפת המשתמש הנוכחי
  getMe: () => apiClient.get<User>('/users/me').then(res => res.data),

  // שליפת כל המדריכים
  getInstructors: () => apiClient.get<User[]>('/instructors').then(res => res.data),

  // אימות סטודיו לפי מספר סידורי
  validateStudio: (serialNumber: string) => apiClient.get<{ valid: boolean; studio: { id: string; name: string } }>(`/users/validate-studio/${serialNumber}`).then(res => res.data),

  // הכנת הרשמה עם אימות סטודיו (אבטחה)
  prepareRegistration: (email: string, serialNumber?: string, invitationToken?: string) => 
    apiClient.post<{ success: boolean; message: string; pendingRegistrationId: string }>(
      '/users/prepare-registration', 
      { email, serialNumber, invitationToken }
    ).then(res => res.data),
};

export const StudioService = {
  create: (data: Partial<Studio> & { branchData: Partial<Branch> }) => apiClient.post<{ message: string; studio: Studio }>('/studios', data).then(res => res.data),
  getMyStudio: () => apiClient.get<Studio>('/studios/my-studio').then(res => res.data),
  update: (id: string, data: Partial<Studio>) => apiClient.put<Studio>(`/studios/${id}`, data).then(res => res.data),
};

export const BranchService = {
  getAll: () => apiClient.get<Branch[]>('/branches').then(res => res.data),
  create: (data: Partial<Branch>) => apiClient.post<Branch>('/branches', data).then(res => res.data),
  update: (id: string, data: Partial<Branch>) => apiClient.put<Branch>(`/branches/${id}`, data).then(res => res.data),
  delete: (id: string) => apiClient.delete(`/branches/${id}`).then(res => res.data),
};

export const RoomService = {
  getAll: () => apiClient.get<Room[]>('/rooms').then(res => res.data),
  getByBranch: (branchId: string) => apiClient.get<Room[]>(`/rooms/branch/${branchId}`).then(res => res.data),
  create: (data: Partial<Room>) => apiClient.post<Room>('/rooms', data).then(res => res.data),
  update: (id: string, data: Partial<Room>) => apiClient.put<Room>(`/rooms/${id}`, data).then(res => res.data),
  delete: (id: string) => apiClient.delete(`/rooms/${id}`).then(res => res.data),
};

export const InvitationService = {
  create: (role: 'ADMIN' | 'INSTRUCTOR') => apiClient.post<{ message: string; invitation: any; link: string }>('/users/invitations', { role }).then(res => res.data),
  validate: (token: string) => apiClient.get<{ valid: boolean; role: string; studioId: string; studio?: any }>(`/users/invitations/${token}`).then(res => res.data),
  accept: (token: string) => apiClient.post('/users/invitations/accept', { token }).then(res => res.data),
};


// --- NEW: Student Service ---
export const StudentService = {
  getAll: (params?: { page?: number; limit?: number; search?: string; ascending?: boolean }) =>
    apiClient.get<{ data: Student[]; count: number }>('/students', { params }).then(res => ({ students: res.data.data || [], count: res.data.count })),
  getByInstructor: () => apiClient.get<Student[]>('/students/my-students').then(res => res.data),
  create: (data: Partial<Student>) => apiClient.post('/students', data).then(res => res.data),
  delete: (id: string) => apiClient.delete(`/students/${id}`).then(res => res.data),
};

export const CourseService = {
  getAll: (params?: { status?: string }) => apiClient.get<ClassSession[]>('/courses', { params }).then(res => res.data),
  create: (data: Partial<ClassSession>) => apiClient.post<ClassSession>('/courses', data).then(res => res.data),
  update: (id: string, data: Partial<ClassSession>) => apiClient.patch<ClassSession>(`/courses/${id}`, data).then(res => res.data),
  delete: (id: string) => apiClient.delete(`/courses/${id}`).then(res => res.data),
  getInstructorCourses: () => apiClient.get<ClassSession[]>('/courses/my-courses').then(res => res.data),
  getAvailableCourses: () => apiClient.get<ClassSession[]>('/courses/available').then(res => res.data),
};

export const EnrollmentService = {
  register: (courseId: string) => apiClient.post('/enrollments/register', { classId: courseId }).then(res => res.data),
  getMyEnrollments: () => apiClient.get<ClassSession[]>('/enrollments/my-enrollments').then(res => res.data),
  getClassEnrollments: (classId: string) => apiClient.get<any[]>(`/enrollments/class/${classId}`).then(res => res.data),
  cancelEnrollment: (id: string) => apiClient.delete(`/enrollments/${id}`).then(res => res.data),
};

export const PaymentService = {
  getAll: () => apiClient.get<PaymentRecord[]>('/payments').then(res => res.data),
  createIntent: (data: { amount: number; currency?: string; description?: string }) =>
    apiClient.post<{ clientSecret: string }>('/payments/create-intent', data).then(res => res.data),
};

export const DashboardService = {
  getAdminStats: () => apiClient.get<DashboardStats>('/dashboard/admin').then(res => res.data),
  getInstructorStats: () => apiClient.get<InstructorStats>('/dashboard/instructor').then(res => res.data),
};