import { Router } from 'express';
import { CourseController } from '../controllers/courseController';

const router = Router();

router.get('/', CourseController.getAll);
router.post('/', CourseController.create);

export default router;