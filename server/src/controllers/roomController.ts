import { Request, Response, NextFunction } from 'express';
import { RoomService } from '../services/roomService';
import { logger } from '../logger';

export class RoomController {

    // Get all rooms for the studio
    static async getAll(req: Request, res: Response, next: NextFunction) {
        const requestLog = req.logger || logger.child({ controller: 'RoomController', method: 'getAll' });
        requestLog.info({ studioId: req.user.studio_id }, 'Controller entry');
        try {
            const studioId = req.user.studio_id;
            const rooms = await RoomService.getAll(studioId);
            requestLog.info({ count: rooms?.length }, 'Fetched rooms successfully');
            res.json(rooms);
        } catch (error: any) {
            requestLog.error({ err: error }, 'Error fetching rooms');
            next(error);
        }
    }

    // Get rooms for a specific branch
    static async getByBranch(req: Request, res: Response, next: NextFunction) {
        const requestLog = req.logger || logger.child({ controller: 'RoomController', method: 'getByBranch' });
        requestLog.info({ branchId: req.params.branchId }, 'Controller entry');
        try {
            const { branchId } = req.params;
            const rooms = await RoomService.getByBranch(branchId);
            requestLog.info({ count: rooms?.length }, 'Fetched rooms for branch successfully');
            res.json(rooms);
        } catch (error: any) {
            requestLog.error({ err: error }, 'Error fetching rooms for branch');
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        const requestLog = req.logger || logger.child({ controller: 'RoomController', method: 'create' });
        requestLog.info({ body: req.body, studioId: req.user.studio_id }, 'Controller entry');
        try {
            const studioId = req.user.studio_id;
            const roomData = req.body;
            const room = await RoomService.create(studioId, roomData);
            requestLog.info({ roomId: room?.id }, 'Room created successfully');
            res.status(201).json(room);
        } catch (error: any) {
            requestLog.error({ err: error }, 'Error creating room');
            next(error);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        const requestLog = req.logger || logger.child({ controller: 'RoomController', method: 'update' });
        requestLog.info({ params: req.params, body: req.body, studioId: req.user.studio_id }, 'Controller entry');
        try {
            const studioId = req.user.studio_id;
            const { id } = req.params;
            const updates = req.body;
            const room = await RoomService.update(id, studioId, updates);
            requestLog.info({ roomId: room?.id }, 'Room updated successfully');
            res.json(room);
        } catch (error: any) {
            requestLog.error({ err: error }, 'Error updating room');
            next(error);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        const requestLog = req.logger || logger.child({ controller: 'RoomController', method: 'delete' });
        requestLog.info({ studioId: req.user.studio_id, roomId: req.params.id }, 'Controller entry');
        try {
            const studioId = req.user.studio_id;
            const { id } = req.params;
            await RoomService.delete(id, studioId);
            requestLog.info({ roomId: id }, 'Room deleted successfully');
            res.json({ message: 'Room deleted' });
        } catch (error: any) {
            requestLog.error({ err: error }, 'Error deleting room');
            next(error);
        }
    }
}
