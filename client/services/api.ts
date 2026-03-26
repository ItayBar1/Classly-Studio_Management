import axios from "axios";
import { logger } from "./logger";
import {
  User,
  Student,
  ClassSession,
  PaymentRecord,
  DashboardStats,
  InstructorStats,
  Studio,
  Branch,
  Room,
} from "../types/types";

import {
  getStoredUser,
  setStoredUser,
  removeStoredUser,
} from "../utils/storage";

const API_URL = import.meta.env.VITE_API_URL;

export { getStoredUser, setStoredUser, removeStoredUser };

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send HttpOnly auth cookie on every request
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor: log outgoing requests
apiClient.interceptors.request.use(
  (config) => {
    logger.info(
      `Starting API Request: ${config.method?.toUpperCase()} ${config.url}`
    );
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Endpoints that should NOT trigger auto-logout on 401.
// Includes auth routes (caller handles credential errors) and the log
// bridge (unauthenticated users can still generate loggable errors).
const AUTH_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/logs",
];

/**
 * Global Response Interceptor
 *
 * Intercepts responses to catch 401 Unauthorized errors (expired or invalid JWT).
 * - For protected API routes, a 401 automatically logs the user out and refreshes the page.
 * - For Auth routes (login/register), auto-logout is bypassed so the caller can display
 *   validation or credential errors directly on the form.
 */
apiClient.interceptors.response.use(
  (response) => {
    logger.info(
      `API Response Success: ${response.status} from ${response.config.url}`
    );
    return response;
  },
  (error) => {
    logger.error(
      `API Error: ${error.response?.status} from ${error.config?.url}`,
      {
        responseData: error.response?.data,
        message: error.message,
      }
    );
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || "";
      const isAuthRequest = AUTH_PATHS.some((path) =>
        requestUrl.includes(path)
      );

      if (!isAuthRequest) {
        // Only reload if the user had an active session (stored user exists).
        // If there is no stored user, this is an unauthenticated visitor hitting
        // /api/auth/me on load — let the caller's catch block handle it normally.
        // Reloading here would create an infinite reload loop for unauthenticated users.
        if (getStoredUser()) {
          removeStoredUser();
          window.location.reload();
        }
      }
    }
    return Promise.reject(error);
  }
);

// --- Auth Service ---
export const AuthService = {
  login: async (email: string, password: string) => {
    const res = await apiClient.post<{ user: User }>("/auth/login", {
      email,
      password,
    });
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
    const res = await apiClient.post<{ user: User; message: string }>(
      "/auth/register",
      data
    );
    setStoredUser(res.data.user);
    return res.data;
  },

  forgotPassword: async (email: string) => {
    const res = await apiClient.post<{ message: string }>(
      "/auth/forgot-password",
      { email }
    );
    return res.data;
  },

  // Clears the HttpOnly cookie server-side, then removes the cached user from localStorage.
  logout: async (): Promise<void> => {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      removeStoredUser();
    }
  },

  // Lean session check — reads the HttpOnly cookie server-side.
  // Returns { id, role, studio_id } on success, throws on 401.
  me: async (): Promise<{
    id: string;
    role: string;
    studio_id: string | null;
  }> => {
    const res = await apiClient.get<{
      id: string;
      role: string;
      studio_id: string | null;
    }>("/auth/me");
    return res.data;
  },

  getCurrentUser: (): User | null => {
    return getStoredUser();
  },
};

// --- Services ---

export const UserService = {
  getMe: () => apiClient.get<User>("/users/me").then((res) => res.data),

  getInstructors: () =>
    apiClient.get<User[]>("/instructors").then((res) => res.data),

  validateStudio: (serialNumber: string) =>
    apiClient
      .get<{
        valid: boolean;
        studio: { id: string; name: string };
      }>(`/users/validate-studio/${serialNumber}`)
      .then((res) => res.data),

  // Prepare registration with studio validation (security check)
  prepareRegistration: (
    email: string,
    serialNumber?: string,
    invitationToken?: string
  ) =>
    apiClient
      .post<{
        success: boolean;
        message: string;
        pendingRegistrationId: string;
      }>("/users/prepare-registration", {
        email,
        serialNumber,
        invitationToken,
      })
      .then((res) => res.data),
};

export const StudioService = {
  create: (data: Partial<Studio> & { branchData: Partial<Branch> }) =>
    apiClient
      .post<{ message: string; studio: Studio }>("/studios", data)
      .then((res) => res.data),
  getMyStudio: () =>
    apiClient.get<Studio>("/studios/my-studio").then((res) => res.data),
  update: (id: string, data: Partial<Studio>) =>
    apiClient.put<Studio>(`/studios/${id}`, data).then((res) => res.data),
};

export const BranchService = {
  getAll: () => apiClient.get<Branch[]>("/branches").then((res) => res.data),
  create: (data: Partial<Branch>) =>
    apiClient.post<Branch>("/branches", data).then((res) => res.data),
  update: (id: string, data: Partial<Branch>) =>
    apiClient.put<Branch>(`/branches/${id}`, data).then((res) => res.data),
  delete: (id: string) =>
    apiClient.delete(`/branches/${id}`).then((res) => res.data),
};

export const RoomService = {
  getAll: () => apiClient.get<Room[]>("/rooms").then((res) => res.data),
  getByBranch: (branchId: string) =>
    apiClient.get<Room[]>(`/rooms/branch/${branchId}`).then((res) => res.data),
  create: (data: Partial<Room>) =>
    apiClient.post<Room>("/rooms", data).then((res) => res.data),
  update: (id: string, data: Partial<Room>) =>
    apiClient.put<Room>(`/rooms/${id}`, data).then((res) => res.data),
  delete: (id: string) =>
    apiClient.delete(`/rooms/${id}`).then((res) => res.data),
};

export const InvitationService = {
  create: (role: "ADMIN" | "INSTRUCTOR" | "STUDENT") =>
    apiClient
      .post<{
        message: string;
        invitation: any;
        link: string;
      }>("/users/invitations", { role })
      .then((res) => res.data),
  validate: (token: string) =>
    apiClient
      .get<{
        valid: boolean;
        role: string;
        studioId: string;
        studio?: any;
      }>(`/users/invitations/${token}`)
      .then((res) => res.data),
  accept: (token: string) =>
    apiClient
      .post("/users/invitations/accept", { token })
      .then((res) => res.data),
};

// --- NEW: Student Service ---
export const StudentService = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    ascending?: boolean;
  }) =>
    apiClient
      .get<{ data: Student[]; count: number }>("/students", { params })
      .then((res) => ({
        students: res.data.data || [],
        count: res.data.count,
      })),
  getByInstructor: () =>
    apiClient.get<Student[]>("/students/my-students").then((res) => res.data),
  create: (data: Partial<Student>) =>
    apiClient.post("/students", data).then((res) => res.data),
  delete: (id: string) =>
    apiClient.delete(`/students/${id}`).then((res) => res.data),
};

export const CourseService = {
  getAll: (params?: { status?: string }) =>
    apiClient
      .get<ClassSession[]>("/courses", { params })
      .then((res) => res.data),
  create: (data: Partial<ClassSession>) =>
    apiClient.post<ClassSession>("/courses", data).then((res) => res.data),
  update: (id: string, data: Partial<ClassSession>) =>
    apiClient
      .patch<ClassSession>(`/courses/${id}`, data)
      .then((res) => res.data),
  delete: (id: string) =>
    apiClient.delete(`/courses/${id}`).then((res) => res.data),
  getInstructorCourses: () =>
    apiClient
      .get<ClassSession[]>("/courses/my-courses")
      .then((res) => res.data),
  getAvailableCourses: () =>
    apiClient.get<ClassSession[]>("/courses/available").then((res) => res.data),
};

export const EnrollmentService = {
  register: (courseId: string) =>
    apiClient
      .post("/enrollments/register", { classId: courseId })
      .then((res) => res.data),
  getMyEnrollments: () =>
    apiClient
      .get<ClassSession[]>("/enrollments/my-enrollments")
      .then((res) => res.data),
  getClassEnrollments: (classId: string) =>
    apiClient
      .get<any[]>(`/enrollments/class/${classId}`)
      .then((res) => res.data),
  cancelEnrollment: (id: string) =>
    apiClient.delete(`/enrollments/${id}`).then((res) => res.data),
  adminEnroll: (studentId: string, classId: string) =>
    apiClient
      .post("/enrollments/admin", { studentId, classId })
      .then((res) => res.data),
  getStudentEnrollments: (studentId: string) =>
    apiClient
      .get<any[]>(`/enrollments/student/${studentId}`)
      .then((res) => res.data),
};

export const PaymentService = {
  getAll: () =>
    apiClient.get<PaymentRecord[]>("/payments").then((res) => res.data),
  createIntent: (data: {
    amount: number;
    currency?: string;
    description?: string;
  }) =>
    apiClient
      .post<{ clientSecret: string }>("/payments/create-intent", data)
      .then((res) => res.data),
};

export const DashboardService = {
  getAdminStats: () =>
    apiClient.get<DashboardStats>("/dashboard/admin").then((res) => res.data),
  getInstructorStats: () =>
    apiClient
      .get<InstructorStats>("/dashboard/instructor")
      .then((res) => res.data),
};
