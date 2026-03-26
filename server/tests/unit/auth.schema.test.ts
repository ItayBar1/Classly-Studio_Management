import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../../src/schemas/auth.schema";

describe("loginSchema", () => {
  it("accepts a valid email and password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "secret",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing email", () => {
    const result = loginSchema.safeParse({ password: "secret" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email format", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "secret",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const valid = {
    email: "new@example.com",
    password: "atleast8chars",
    full_name: "Alice",
  };

  it("accepts a valid registration payload", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({ ...valid, password: "short" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = registerSchema.safeParse({ ...valid, email: "bad-email" });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields being omitted", () => {
    const result = registerSchema.safeParse({
      email: "x@x.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });
});

describe("forgotPasswordSchema", () => {
  it("accepts a valid email", () => {
    expect(
      forgotPasswordSchema.safeParse({ email: "user@example.com" }).success
    ).toBe(true);
  });

  it("rejects a missing email", () => {
    expect(forgotPasswordSchema.safeParse({}).success).toBe(false);
  });

  it("rejects an invalid email format", () => {
    expect(forgotPasswordSchema.safeParse({ email: "nope" }).success).toBe(
      false
    );
  });
});

describe("resetPasswordSchema", () => {
  it("accepts a valid token and new password", () => {
    const result = resetPasswordSchema.safeParse({
      token: "abc123",
      password: "newpass123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing token", () => {
    const result = resetPasswordSchema.safeParse({ password: "newpass123" });
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = resetPasswordSchema.safeParse({
      token: "abc123",
      password: "short",
    });
    expect(result.success).toBe(false);
  });
});
