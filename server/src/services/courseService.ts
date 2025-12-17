import { supabase } from '../config/supabase';

export class CourseService {
  
  /**
   * Get all courses with optional filters
   */
  static async getAllCourses(userRole: string, filters: any = {}) {
    let query = supabase.from('classes').select('*, instructor:users(full_name)');

    // If student, only show active courses
    if (userRole === 'STUDENT') {
      query = query.eq('is_active', true);
    }

    // Apply generic filters if provided (e.g., category_id)
    if (filters.category_id) {
        query = query.eq('category_id', filters.category_id);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Get available courses for student (active & not fully booked)
   * Note: Need to verify student isn't already enrolled in logic later
   */
  static async getAvailableForStudent(studentId: string) {
    // מביא קורסים פעילים. 
    // בשיפור עתידי: נסנן קורסים שהתלמיד כבר רשום אליהם באמצעות join ל-enrollments
    const { data, error } = await supabase
      .from('classes')
      .select('*, instructor:users(full_name)')
      .eq('is_active', true)
      .gt('max_capacity', supabase.rpc('current_enrollment_check')); // או פשוט סינון בקוד

    // לבינתיים פשוט נחזיר פעילים, הסינון של "כבר רשום" יכול להיעשות בקלינט או בשאילתה מורכבת יותר
    if (error) throw new Error(error.message);
    return data;
  }

  static async getCourseById(id: string) {
    const { data, error } = await supabase
      .from('classes')
      .select('*, instructor:users(full_name, profile_image_url), studio:studios(name)')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async getCoursesByInstructor(instructorId: string) {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('instructor_id', instructorId)
      .order('day_of_week', { ascending: true });

    if (error) throw new Error(error.message);
    return data;
  }

  static async createCourse(courseData: any) {
    const { data, error } = await supabase
      .from('classes')
      .insert([courseData])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async updateCourse(id: string, updates: any) {
    const { data, error } = await supabase
      .from('classes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async softDeleteCourse(id: string) {
    // Soft delete: set is_active to false
    const { error } = await supabase
      .from('classes')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw new Error(error.message);
    return true;
  }
}