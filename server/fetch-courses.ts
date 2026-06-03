import { CourseService } from './src/services/courseService';
async function run() {
  const courses = await CourseService.getCoursesByInstructor("cfc29466-02b8-49b0-b283-5fc520f4bd74");
  console.log(JSON.stringify(courses[0], null, 2));
}
run();
