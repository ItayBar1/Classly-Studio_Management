import axios from "axios";
import { supabase } from "../supabaseClient"; // תוודא שיש לך קובץ שמייצא את הקליינט של סופבייס

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor להוספת הטוקן לכל בקשה
apiClient.interceptors.request.use(
  async (config) => {
    // שליפת ה-Session הנוכחי מ-Supabase
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// פונקציות עזר (Services)
export const CourseService = {
  getAll: () => apiClient.get("/courses").then((res) => res.data),
  create: (data: any) =>
    apiClient.post("/courses", data).then((res) => res.data),
  // הוסף פונקציות נוספות כאן
};
