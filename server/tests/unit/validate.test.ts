import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { validate } from "../../src/middleware/validate";

// Minimal mock helpers
const mockReq = (body: unknown) => ({ body }) as Request;

const mockRes = () => ({}) as Response;

const mockNext = jest.fn() as jest.MockedFunction<NextFunction>;

beforeEach(() => {
  mockNext.mockReset();
});

describe("validate middleware", () => {
  const schema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
  });

  it("calls next() without error when body is valid", () => {
    const req = mockReq({ name: "Alice", email: "alice@example.com" });
    validate(schema)(req, mockRes(), mockNext);
    expect(mockNext).toHaveBeenCalledWith(); // no argument = success
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it("calls next(error) with 400 status when a required field is missing", () => {
    const req = mockReq({ name: "Alice" }); // missing email
    validate(schema)(req, mockRes(), mockNext);
    const [err] = mockNext.mock.calls[0];
    expect(err).toBeInstanceOf(Error);
    expect((err as any).statusCode).toBe(400);
  });

  it("calls next(error) when field type is wrong", () => {
    const schemaWithNum = z.object({ count: z.number() });
    const req = mockReq({ count: "not-a-number" });
    validate(schemaWithNum)(req, mockRes(), mockNext);
    const [err] = mockNext.mock.calls[0];
    expect(err).toBeInstanceOf(Error);
    expect((err as any).statusCode).toBe(400);
  });
});

describe("validate middleware — HTML sanitization", () => {
  const schema = z.object({ name: z.string() });

  it("strips <script> tags from string fields before schema parse", () => {
    const req = mockReq({ name: "<script>alert(1)</script>Hello" });
    validate(schema)(req, mockRes(), mockNext);
    expect(req.body.name).toBe("Hello");
    expect(mockNext).toHaveBeenCalledWith(); // still valid after stripping
  });

  it("strips HTML from nested object fields", () => {
    const nested = z.object({ user: z.object({ bio: z.string() }) });
    const req = mockReq({ user: { bio: "<b>bold</b> text" } });
    validate(nested)(req, mockRes(), mockNext);
    expect(req.body.user.bio).toBe("bold text");
  });

  it("does NOT sanitize password fields", () => {
    const schemaWithPw = z.object({ password: z.string().min(1) });
    const req = mockReq({ password: "P@ss<secret>" });
    validate(schemaWithPw)(req, mockRes(), mockNext);
    // password must be passed through unchanged
    expect(req.body.password).toBe("P@ss<secret>");
  });

  it("does NOT sanitize token fields", () => {
    const schemaWithToken = z.object({ token: z.string().min(1) });
    const req = mockReq({ token: "abc<123>def" });
    validate(schemaWithToken)(req, mockRes(), mockNext);
    expect(req.body.token).toBe("abc<123>def");
  });

  it("leaves plain text unchanged", () => {
    const req = mockReq({ name: "Just plain text" });
    validate(schema)(req, mockRes(), mockNext);
    expect(req.body.name).toBe("Just plain text");
  });
});
