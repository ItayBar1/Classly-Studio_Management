import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { vi, describe, it, expect, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import { Administration } from "../admin/Administration/Administration";
import {
  StudioService,
  BranchService,
  RoomService,
  UserService,
} from "../../services/api";

vi.mock("../../services/api", () => ({
  StudioService: { getMyStudio: vi.fn(), create: vi.fn(), update: vi.fn() },
  BranchService: { getAll: vi.fn(), delete: vi.fn() },
  RoomService: { getAll: vi.fn(), getByBranch: vi.fn() },
  UserService: { getInstructors: vi.fn() },
  InvitationService: { createInvite: vi.fn() },
}));

const studio = {
  id: "studio-1",
  name: "סטודיו תל אביב",
  serial_number: "260816-000001",
};

const renderAdministration = () =>
  render(
    <HelmetProvider>
      <Administration />
    </HelmetProvider>
  );

const axiosError = (status: number) => ({
  response: { status, data: { message: "boom" } },
  message: "Request failed",
});

const ONBOARDING_HEADING = "ברוכים הבאים ל-Classly!";

describe("Administration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(BranchService.getAll).mockResolvedValue([]);
    vi.mocked(RoomService.getAll).mockResolvedValue([]);
    vi.mocked(UserService.getInstructors).mockResolvedValue([]);
  });

  it("shows the onboarding form only when the admin has no studio (404)", async () => {
    vi.mocked(StudioService.getMyStudio).mockRejectedValue(axiosError(404));

    renderAdministration();

    expect(await screen.findByText(ONBOARDING_HEADING)).toBeInTheDocument();
  });

  it("shows an error instead of the onboarding form when the studio request fails", async () => {
    // A 500 (e.g. a database column Prisma expects is missing) must not look
    // like "this admin has no studio yet".
    vi.mocked(StudioService.getMyStudio).mockRejectedValue(axiosError(500));

    renderAdministration();

    expect(await screen.findByText("boom")).toBeInTheDocument();
    expect(screen.queryByText(ONBOARDING_HEADING)).not.toBeInTheDocument();
  });

  it("keeps showing the studio when a secondary request fails", async () => {
    vi.mocked(StudioService.getMyStudio).mockResolvedValue(studio as any);
    vi.mocked(BranchService.getAll).mockRejectedValue(axiosError(500));

    renderAdministration();

    await waitFor(() =>
      expect(screen.getAllByText(studio.name).length).toBeGreaterThan(0)
    );
    expect(screen.queryByText(ONBOARDING_HEADING)).not.toBeInTheDocument();
  });

  it("renders the studio when everything loads", async () => {
    vi.mocked(StudioService.getMyStudio).mockResolvedValue(studio as any);

    renderAdministration();

    await waitFor(() =>
      expect(screen.getAllByText(studio.name).length).toBeGreaterThan(0)
    );
    expect(screen.getByText(studio.serial_number)).toBeInTheDocument();
    expect(screen.queryByText(ONBOARDING_HEADING)).not.toBeInTheDocument();
  });
});
