import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import { ResetPassword } from "../ResetPassword";
import { apiClient } from "../../services/api";

// Mock the API client
vi.mock("../../services/api", () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

describe("ResetPassword Component", () => {
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly with Hebrew text", () => {
    render(<ResetPassword onSuccess={mockOnSuccess} />);

    expect(screen.getByText("איפוס סיסמה")).toBeInTheDocument();
    expect(screen.getByLabelText("סיסמה חדשה")).toBeInTheDocument();
    expect(screen.getByLabelText("אימות סיסמה")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "עדכן סיסמה" })
    ).toBeInTheDocument();
  });

  it("shows error if password is too short", async () => {
    render(<ResetPassword onSuccess={mockOnSuccess} />);

    const passwordInput = screen.getByLabelText("סיסמה חדשה");
    const confirmInput = screen.getByLabelText("אימות סיסמה");
    const submitButton = screen.getByRole("button", { name: "עדכן סיסמה" });

    fireEvent.change(passwordInput, { target: { value: "123" } });
    fireEvent.change(confirmInput, { target: { value: "123" } });
    fireEvent.click(submitButton);

    expect(
      await screen.findByText("הסיסמה חייבת להכיל לפחות 8 תווים")
    ).toBeInTheDocument();
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it("shows error if passwords do not match", async () => {
    render(<ResetPassword onSuccess={mockOnSuccess} />);

    const passwordInput = screen.getByLabelText("סיסמה חדשה");
    const confirmInput = screen.getByLabelText("אימות סיסמה");
    const submitButton = screen.getByRole("button", { name: "עדכן סיסמה" });

    fireEvent.change(passwordInput, { target: { value: "12345678" } });
    fireEvent.change(confirmInput, { target: { value: "87654321" } });
    fireEvent.click(submitButton);

    expect(await screen.findByText("הסיסמאות אינן תואמות")).toBeInTheDocument();
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it("calls reset-password endpoint and onSuccess when valid", async () => {
    (apiClient.post as any).mockResolvedValue({ data: { message: "OK" } });

    // Set a token in the URL
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...window.location, search: '?token=test-token-123' },
    });

    render(<ResetPassword onSuccess={mockOnSuccess} />);

    const passwordInput = screen.getByLabelText("סיסמה חדשה");
    const confirmInput = screen.getByLabelText("אימות סיסמה");
    const submitButton = screen.getByRole("button", { name: "עדכן סיסמה" });

    fireEvent.change(passwordInput, { target: { value: "newpassword123" } });
    fireEvent.change(confirmInput, { target: { value: "newpassword123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/auth/reset-password', {
        token: 'test-token-123',
        password: "newpassword123",
      });
    });

    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it("toggles password visibility", () => {
    render(<ResetPassword onSuccess={mockOnSuccess} />);

    const passwordInput = screen.getByLabelText(
      "סיסמה חדשה"
    ) as HTMLInputElement;
    const toggleButton = screen.getAllByRole("button", {
      name: /הצג סיסמה|הסתר סיסמה/,
    })[0];

    expect(passwordInput.type).toBe("password");

    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe("text");

    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe("password");
  });
});
