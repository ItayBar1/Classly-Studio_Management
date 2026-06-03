import { CourseService } from './src/services/courseService';
async function main() {
  const data = await CourseService.getCoursesByInstructor("cfc29466-02b8-49b0-b283-5fc520f4bd74");
  console.log(JSON.stringify(data, null, 2));
}
main().catch(console.error);
