import { Request, Response } from 'express';
import { InstructorService } from '../services/instructorService';

export class InstructorController {
    static async getAllInstructors(req: Request, res: Response) {
        try {
            const instructors = await InstructorService.getAllInstructors();
            res.json(instructors);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async deleteInstructor(req: Request, res: Response) {
        try {
            await InstructorService.softDeleteInstructor(req.params.id);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    static async getEarnings(req: Request, res: Response) {
        // Implementation for earnings report
    }
}