import { Request, Response, NextFunction } from 'express';
import { RoomService } from '../services/roomService';
import { logger } from '../logger';

export class RoomController {

    // Get all rooms for the studio
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const studioId = req.user.studio_id;
            const rooms = await RoomService.getAll(studioId);
            res.json(rooms);
        } catch (error) {
            next(error);
        }
    }

    // Get rooms for a specific branch
    static async getByBranch(req: Request, res: Response, next: NextFunction) {
        try {
            const { branchId } = req.params;
            const rooms = await RoomService.getByBranch(branchId);
            res.json(rooms);
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const studioId = req.user.studio_id;
            const roomData = req.body;
            const room = await RoomService.create(studioId, roomData);
            res.status(201).json(room);
        } catch (error) {
            next(error);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const studioId = req.user.studio_id;
            const { id } = req.params;
            const updates = req.body;
            const room = await RoomService.update(id, studioId, updates);
            res.json(room);
        } catch (error) {
            next(error);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const studioId = req.user.studio_id;
            const { id } = req.params;
            await RoomService.delete(id, studioId);
            res.json({ message: 'Room deleted' });
        } catch (error) {
            next(error);
        }
    }
}
