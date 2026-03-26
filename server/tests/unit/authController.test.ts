import { AuthController } from "../../src/controllers/authController";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../src/config/prisma";

// jest.mock is hoisted before variable declarations, so the mock object must be
// defined inside the factory — not in the outer scope.
jest.mock("../../src/config/prisma", () => ({
  prisma: {
    users: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    studios: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("../../src/logger", () => ({
  logger: {
    child: () => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }),
  },
}));

jest.mock("bcryptjs", () => ({
  genSalt: jest.fn().mockResolvedValue("salt"),
  hash: jest.fn().mockResolvedValue("hashed_password"),
  compare: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn().mockReturnValue("mock_jwt_token"),
}));

jest.mock("../../src/services/emailService", () => ({
  EmailService: {
    sendPasswordResetEmail: jest.fn(),
  },
}));

// Alias for ergonomic access to mock functions in test bodies.
const mockPrisma = prisma as any;

describe("AuthController", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {},
      logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() } as any,
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      // Phase 2: auth token is set as an HttpOnly cookie, not returned in JSON.
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };
    next = jest.fn();
  });

  describe("login", () => {
    it("returns 400 if email or password missing", async () => {
      req.body = { email: "test@test.com" };
      await AuthController.login(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Email and password are required",
      });
    });

    it("returns 401 if user not found", async () => {
      req.body = { email: "test@test.com", password: "password123" };
      mockPrisma.users.findUnique.mockResolvedValue(null);

      await AuthController.login(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid email or password",
      });
    });

    it("returns 401 if password mismatch", async () => {
      req.body = { email: "test@test.com", password: "wrong" };
      mockPrisma.users.findUnique.mockResolvedValue({
        id: "user1",
        email: "test@test.com",
        password_hash: "$2b$stored_hash",
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await AuthController.login(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid email or password",
      });
    });

    it("returns 403 if user is suspended", async () => {
      req.body = { email: "test@test.com", password: "password123" };
      mockPrisma.users.findUnique.mockResolvedValue({
        id: "user1",
        email: "test@test.com",
        password_hash: "$2b$stored_hash",
        role: "STUDENT",
        status: "SUSPENDED",
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await AuthController.login(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Account is suspended",
      });
    });

    it("sets HttpOnly cookie and returns 200 with user on success", async () => {
      req.body = { email: "test@test.com", password: "password123" };
      mockPrisma.users.findUnique.mockResolvedValue({
        id: "user1",
        email: "test@test.com",
        password_hash: "$2b$stored_hash",
        role: "STUDENT",
        status: "ACTIVE",
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrisma.users.update.mockResolvedValue({});

      await AuthController.login(req as Request, res as Response, next);

      // Token is delivered via cookie, not JSON body
      expect(res.cookie).toHaveBeenCalledWith(
        "classly_token",
        "mock_jwt_token",
        expect.objectContaining({ httpOnly: true })
      );
      expect(jwt.sign).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({ email: "test@test.com" }),
        })
      );
    });
  });

  describe("register", () => {
    it("returns 409 if user exists", async () => {
      req.body = { email: "exists@test.com", password: "pass" };
      mockPrisma.users.findUnique.mockResolvedValue({ id: "exists" });

      await AuthController.register(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: "User with this email already exists",
      });
    });

    it("sets HttpOnly cookie and returns 201 with user on success", async () => {
      req.body = {
        email: "new@test.com",
        password: "pass",
        studio_serial: "SER-1",
      };
      mockPrisma.users.findUnique.mockResolvedValue(null);
      mockPrisma.studios.findUnique.mockResolvedValue({ id: "studio-1" });
      mockPrisma.users.create.mockResolvedValue({
        id: "new-user",
        email: "new@test.com",
        role: "STUDENT",
        studio_id: "studio-1",
      });

      await AuthController.register(req as Request, res as Response, next);

      // Token is delivered via cookie, not JSON body
      expect(res.cookie).toHaveBeenCalledWith(
        "classly_token",
        "mock_jwt_token",
        expect.objectContaining({ httpOnly: true })
      );
      expect(mockPrisma.users.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({ email: "new@test.com" }),
        })
      );
    });
  });
});
