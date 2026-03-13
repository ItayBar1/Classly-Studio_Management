import { AuthController } from '../../src/controllers/authController';
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const mockPrisma = {
  users: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  studios: {
    findUnique: jest.fn(),
  },
};

jest.mock('../../src/config/prisma', () => ({
  prisma: mockPrisma,
}));

jest.mock('../../src/logger', () => ({
  logger: {
    child: () => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }),
  },
}));

jest.mock('bcryptjs', () => ({
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock_jwt_token'),
}));

jest.mock('../../src/services/emailService', () => ({
  EmailService: {
    sendPasswordResetEmail: jest.fn(),
  },
}));

describe('AuthController', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  describe('login', () => {
    it('returns 400 if email or password missing', async () => {
      req.body = { email: 'test@test.com' };
      await AuthController.login(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email and password are required' });
    });

    it('returns 401 if user not found', async () => {
      req.body = { email: 'test@test.com', password: 'password123' };
      mockPrisma.users.findUnique.mockResolvedValue(null);

      await AuthController.login(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid email or password' });
    });

    it('returns 401 if password mismatch', async () => {
      req.body = { email: 'test@test.com', password: 'wrong' };
      mockPrisma.users.findUnique.mockResolvedValue({
        id: 'user1',
        email: 'test@test.com',
        password_hash: '$2b$stored_hash',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await AuthController.login(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid email or password' });
    });

    it('returns 200 and token on success', async () => {
      req.body = { email: 'test@test.com', password: 'password123' };
      mockPrisma.users.findUnique.mockResolvedValue({
        id: 'user1',
        email: 'test@test.com',
        password_hash: '$2b$stored_hash',
        role: 'STUDENT',
        status: 'ACTIVE',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrisma.users.update.mockResolvedValue({});

      await AuthController.login(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'mock_jwt_token',
          user: expect.objectContaining({ email: 'test@test.com' }),
        })
      );
      expect(jwt.sign).toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('returns 409 if user exists', async () => {
      req.body = { email: 'exists@test.com', password: 'pass' };
      mockPrisma.users.findUnique.mockResolvedValue({ id: 'exists' });

      await AuthController.register(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: 'User with this email already exists' });
    });

    it('registers user and returns token', async () => {
      req.body = { email: 'new@test.com', password: 'pass', studio_serial: 'SER-1' };
      mockPrisma.users.findUnique.mockResolvedValue(null);
      mockPrisma.studios.findUnique.mockResolvedValue({ id: 'studio-1' });
      mockPrisma.users.create.mockResolvedValue({
        id: 'new-user',
        email: 'new@test.com',
        role: 'STUDENT',
        studio_id: 'studio-1',
      });

      await AuthController.register(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockPrisma.users.create).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'mock_jwt_token',
          user: expect.objectContaining({ email: 'new@test.com' }),
        })
      );
    });
  });
});
