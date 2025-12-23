import { supabaseAdmin } from "../config/supabase";
import { logger } from "../logger";

interface InstructorStudent {
  student?: {
    id: string;
    full_name: string;
    email: string;
    phone_number: string;
    profile_image_url?: string | null;
  };
  class?: {
    name?: string | null;
  };
}

interface StudentPayload {
  email: string;
  full_name: string;
  phone_number?: string;
  password?: string;
}

export const StudentService = {
  async getAll(
    studioId: string,
    page: number = 1,
    limit: number = 50,
    search: string = ""
  ) {
    const serviceLogger = logger.child({ service: "StudentService", method: "getAll" });
    serviceLogger.info({ studioId, page, limit, search }, "Fetching students list");

    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from("users")
      .select("*", { count: "exact" })
      .eq("role", "STUDENT")
      .eq("studio_id", studioId)
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.ilike("full_name", `%${search}%`);
    }

    const { data, count, error } = await query;
    if (error) {
      serviceLogger.error({ err: error }, "Failed to fetch students");
      throw error;
    }

    serviceLogger.info({ count }, "Students fetched successfully");
    return { data, count };
  },

  async getById(id: string) {
    const serviceLogger = logger.child({ service: "StudentService", method: "getById" });
    serviceLogger.info({ id }, "Fetching student by id");

    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      serviceLogger.error({ err: error }, "Failed to fetch student");
      throw error;
    }
    return data;
  },

async getByInstructor(instructorId: string) {
    // Retrieve enrollments for courses taught by the instructor
    const { data, error } = await supabaseAdmin
      .from("enrollments")
      .select(
        `
        student:users!enrollments_student_id_fkey (
          id, full_name, email, phone_number, profile_image_url
        ),
        class:classes!inner (
          name
        )
      `
      )
      .eq("class.instructor_id", instructorId)
      .eq("status", "ACTIVE");

    if (error) throw error;

    // Consolidate data to remove duplicates
    const studentMap = new Map();

    // Convert to any[] to bypass Supabase typing limitations
    (data as any[]).forEach((item) => {
      // Guard to ensure student object exists
      const studentData = Array.isArray(item.student) ? item.student[0] : item.student;
      
      if (!studentData) return;

      const existing = studentMap.get(studentData.id);
      
      // Handle class response as array or object
      const classData = Array.isArray(item.class) ? item.class[0] : item.class;
      const className = classData?.name;

      if (existing) {
        if (className && !existing.enrolledClass.includes(className)) {
          existing.enrolledClass += `, ${className}`;
        }
      } else {
        studentMap.set(studentData.id, {
          ...studentData,
          enrolledClass: className || "",
          role: "STUDENT",
        });
      }
    });

    return Array.from(studentMap.values());
  },

  async create(studioId: string, studentData: StudentPayload) {
    const serviceLogger = logger.child({ service: "StudentService", method: "create" });
    serviceLogger.info({ studioId, email: studentData.email }, "Creating student");

    const { email, full_name, phone_number, password } = studentData;

    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: password || "123456",
        email_confirm: true,
      });

    if (authError) {
      serviceLogger.error({ err: authError }, "Failed to create auth user");
      throw authError;
    }

    // 2. Update details in users table
    const { data, error } = await supabaseAdmin
      .from("users")
      .update({
        full_name,
        phone_number,
        role: "STUDENT",
        studio_id: studioId,
        status: "ACTIVE",
      })
      .eq("id", authData.user.id)
      .select()
      .single();

    if (error) {
      serviceLogger.error({ err: error }, "Failed to update student record");
      throw error;
    }
    return data;
  },

  /**
   * Soft delete a student (set status to INACTIVE)
   * @param studentId the student identifier
   */
  async deleteStudent(studentId: string) {
    const serviceLogger = logger.child({ service: "StudentService", method: "deleteStudent" });
    serviceLogger.info({ studentId }, "Soft deleting student");

    // 1. Ensure the user exists and is a student
    const { data: user, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", studentId)
      .single();

    if (fetchError || !user) {
      serviceLogger.error({ err: fetchError }, "Student not found during delete");
      throw new Error("Student not found");
    }

    if (user.role !== "STUDENT") {
      throw new Error(
        "Cannot delete a user who is not a student via this endpoint"
      );
    }

    // 2. Soft delete - update status
    const { data, error } = await supabaseAdmin
      .from("users")
      .update({
        status: "INACTIVE",
        updated_at: new Date().toISOString(),
      })
      .eq("id", studentId)
      .select()
      .single();

    if (error) {
      serviceLogger.error({ err: error }, "Failed to soft delete student");
      throw new Error(`Failed to delete student: ${error.message}`);
    }

    serviceLogger.info({ studentId }, "Student soft deleted successfully");
    return data;
  },
};
