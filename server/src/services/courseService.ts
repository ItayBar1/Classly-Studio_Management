import { supabaseAdmin } from "../config/supabase";
import { logger } from "../logger";

type CourseFilters = {
  category_id?: string | number;
  [key: string]: unknown;
};

export class CourseService {
  /**
   * Get all courses with optional filters
   */
  static async getAllCourses(studioId: string, userRole?: string, filters: CourseFilters = {}) {
    const serviceLogger = logger.child({
      service: "CourseService",
      method: "getAllCourses",
    });
    serviceLogger.info({ studioId, userRole, filters }, "Fetching all courses");

    let query = supabaseAdmin
      .from("classes")
      .select("*, instructor:users(full_name)")
      .eq("studio_id", studioId);

    // If student, only show active courses
    if (userRole === "STUDENT") {
      query = query.eq("is_active", true);
    }

    // Apply generic filters if provided (e.g., category_id)
    if (filters.category_id) {
      query = query.eq("category_id", filters.category_id);
    }

    const { data, error } = await query;
    if (error) {
      serviceLogger.error({ err: error }, "Failed to fetch courses");
      throw new Error(error.message);
    }
    serviceLogger.info({ count: data?.length }, "Courses fetched successfully");
    return data;
  }

  /**
   * Get available courses for student (active & not fully booked)
   * Note: Need to verify student isn't already enrolled in logic later
   */
  static async getAvailableForStudent(studentId: string) {
    const serviceLogger = logger.child({
      service: "CourseService",
      method: "getAvailableForStudent",
    });
    serviceLogger.info({ studentId }, "Fetching available courses for student");
    // 1. Get student's studio_id
    const { data: student, error: studentError } = await supabaseAdmin
      .from("users")
      .select("studio_id")
      .eq("id", studentId)
      .single();

    if (studentError || !student) {
      serviceLogger.error({ err: studentError }, "Failed to fetch student for available courses");
      throw new Error("Student not found");
    }

    // 2. Fetch active courses for that studio
    const { data, error } = await supabaseAdmin
      .from("classes")
      .select("*, instructor:users(full_name)")
      .eq("studio_id", student.studio_id)
      .eq("is_active", true);

    if (error) throw error;

    // סנן ב-JS קורסים מלאים
    const availableCourses = data.filter(
      (course) => course.current_enrollment < course.max_capacity
    );

    return availableCourses;
  }

  static async getCourseById(id: string) {
    const serviceLogger = logger.child({
      service: "CourseService",
      method: "getCourseById",
    });
    serviceLogger.info({ id }, "Fetching course by id");
    const { data, error } = await supabaseAdmin
      .from("classes")
      .select(
        "*, instructor:users(full_name, profile_image_url), studio:studios(name)"
      )
      .eq("id", id)
      .single();

    if (error) {
      serviceLogger.error({ err: error }, "Failed to fetch course by id");
      throw new Error(error.message);
    }
    return data;
  }

  static async getCoursesByInstructor(instructorId: string) {
    const serviceLogger = logger.child({
      service: "CourseService",
      method: "getCoursesByInstructor",
    });
    serviceLogger.info({ instructorId }, "Fetching courses by instructor");
    const { data, error } = await supabaseAdmin
      .from("classes")
      .select("*")
      .eq("instructor_id", instructorId)
      .order("day_of_week", { ascending: true });

    if (error) {
      serviceLogger.error({ err: error }, "Failed to fetch instructor courses");
      throw new Error(error.message);
    }
    return data;
  }

  static async createCourse(courseData: Record<string, unknown>) {
    const serviceLogger = logger.child({
      service: "CourseService",
      method: "createCourse",
    });
    serviceLogger.info({ courseData }, "Creating course");
    const { data, error } = await supabaseAdmin
      .from("classes")
      .insert([courseData])
      .select()
      .single();

    if (error) {
      serviceLogger.error({ err: error }, "Failed to create course");
      throw new Error(error.message);
    }
    return data;
  }

  static async updateCourse(id: string, updates: Record<string, unknown>) {
    const serviceLogger = logger.child({
      service: "CourseService",
      method: "updateCourse",
    });
    serviceLogger.info({ id, updates }, "Updating course");
    const { data, error } = await supabaseAdmin
      .from("classes")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      serviceLogger.error({ err: error }, "Failed to update course");
      throw new Error(error.message);
    }
    return data;
  }

  static async softDeleteCourse(id: string) {
    const serviceLogger = logger.child({
      service: "CourseService",
      method: "softDeleteCourse",
    });
    serviceLogger.info({ id }, "Soft deleting course");
    // Soft delete: set is_active to false
    const { error } = await supabaseAdmin
      .from("classes")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      serviceLogger.error({ err: error }, "Failed to soft delete course");
      throw new Error(error.message);
    }
    serviceLogger.info({ id }, "Course deactivated");
    return true;
  }
}
