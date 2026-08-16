import { Request, Response, NextFunction } from "express";
import { InstructorService } from "../services/instructorService";

export class InstructorController {
  // Retrieve all instructors (admin)
  static async getAll(req: Request, res: Response, next: NextFunction) {
    const requestLog = req.logger!;
    requestLog.info({ studioId: req.user!.studio_id }, "Controller entry");
    try {
      const studioId = req.user!.studio_id;
      if (!studioId) {
        return res.status(400).json({ error: "Studio ID is missing" });
      }
      const instructors = await InstructorService.getAllInstructors(studioId);
      requestLog.info({ count: instructors?.length }, "Fetched instructors");
      res.json(instructors);
    } catch (error: any) {
      requestLog.error({ err: error }, "Error fetching instructors");
      next(error);
    }
  }

  // Retrieve instructor by ID
  static async getById(req: Request, res: Response, next: NextFunction) {
    const requestLog = req.logger!;
    requestLog.info(
      { params: req.params, userId: req.user!.id },
      "Controller entry"
    );
    try {
      const { id } = req.params;
      const requestingUser = req.user!;

      // Authorization: only admin or the instructor can view the profile
      if (requestingUser.role !== "ADMIN" && requestingUser.id !== id) {
        return res
          .status(403)
          .json({ error: "Unauthorized access to instructor profile" });
      }

      const instructor = await InstructorService.getInstructorById(
        id,
        req.studioId
      );
      if (!instructor) {
        return res.status(404).json({ error: "Instructor not found" });
      }
      requestLog.info({ instructorId: id }, "Fetched instructor by id");
      res.json(instructor);
    } catch (error: any) {
      requestLog.error({ err: error }, "Error fetching instructor");
      next(error);
    }
  }

  // Retrieve earnings/commissions for the authenticated instructor
  static async getMyEarnings(req: Request, res: Response, next: NextFunction) {
    const requestLog = req.logger!;
    requestLog.info({ userId: req.user!.id }, "Controller entry");
    try {
      const instructorId = req.user!.id;
      const earnings = await InstructorService.getEarnings(instructorId);
      requestLog.info(
        { count: earnings?.length },
        "Fetched instructor earnings"
      );
      res.json(earnings);
    } catch (error: any) {
      requestLog.error({ err: error }, "Error fetching instructor earnings");
      next(error);
    }
  }

  // Soft delete instructor
  static async delete(req: Request, res: Response, next: NextFunction) {
    const requestLog = req.logger!;
    requestLog.info({ params: req.params }, "Controller entry");
    try {
      const { id } = req.params;
      // Future: ensure instructor has no active classes before deletion
      await InstructorService.softDeleteInstructor(id);
      requestLog.info({ instructorId: id }, "Instructor deactivated");
      res.json({ message: "Instructor deactivated successfully" });
    } catch (error: any) {
      requestLog.error({ err: error }, "Error deleting instructor");
      next(error);
    }
  }
}
