import { createClient } from '@supabase/supabase-js';

// יצירת לקוח עם הרשאות Admin (Service Role)
const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const CourseRepository = {
    async getAllCourses() {
        const { data, error } = await supabase
            .from('courses')
            .select('*');
        if (error) throw new Error(error.message);
        return data;
    },

    async createCourse(courseData: any) {
        const { data, error } = await supabase
            .from('courses')
            .insert([courseData])
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    }
};