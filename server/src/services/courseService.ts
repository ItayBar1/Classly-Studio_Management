import { CourseRepository } from '../repositories/courseRepository';

export const CourseService = {
    async getCourses() {
        // כאן אפשר להוסיף לוגיקה, למשל: סינון קורסים לא פעילים
        return await CourseRepository.getAllCourses();
    },

    async addCourse(name: string, capacity: number) {
        if (capacity < 1) {
            throw new Error("Capacity must be at least 1");
        }
        const newCourse = { name, capacity, created_at: new Date() };
        return await CourseRepository.createCourse(newCourse);
    }
};