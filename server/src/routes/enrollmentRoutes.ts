// routes/enrollmentRoutes.ts
router.post('/admin/add', requireRole(['ADMIN']), EnrollmentController.adminEnrollStudent);
router.delete('/:id', requireRole(['ADMIN']), EnrollmentController.removeEnrollment);