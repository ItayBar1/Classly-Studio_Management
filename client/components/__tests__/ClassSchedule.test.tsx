import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { vi, describe, it, expect, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import { ClassSchedule } from "../admin/ClassSchedule";
import {
  CourseService,
  BranchService,
  RoomService,
  StudioService,
} from "../../services/api";

vi.mock("../../services/api", () => ({
  CourseService: { getAll: vi.fn(), delete: vi.fn() },
  BranchService: { getAll: vi.fn() },
  RoomService: { getAll: vi.fn() },
  StudioService: { getMyStudio: vi.fn() },
  UserService: { getInstructors: vi.fn(() => Promise.resolve([])) },
}));

// The modal pulls in its own services and is not what these tests exercise.
vi.mock("../admin/AddClassModal", () => ({
  AddClassModal: () => null,
}));

const BRANCH_ID = "branch-1";
const ROOM_ID = "room-1";

const branch = { id: BRANCH_ID, name: "תל אביב", studio_id: "s1" };
const room = {
  id: ROOM_ID,
  name: "אולם 1",
  branch_id: BRANCH_ID,
  studio_id: "s1",
  capacity: 20,
};

const makeClass = (over: Record<string, any>) => ({
  id: "c-" + Math.random().toString(36).slice(2),
  name: "שיעור",
  branch_id: BRANCH_ID,
  day_of_week: 0,
  start_time: "1970-01-01T09:00:00.000Z",
  end_time: "1970-01-01T10:00:00.000Z",
  max_capacity: 20,
  current_enrollment: 0,
  level: "ALL_LEVELS",
  instructor: { full_name: "מדריך" },
  ...over,
});

const renderSchedule = () =>
  render(
    <HelmetProvider>
      <ClassSchedule />
    </HelmetProvider>
  );

describe("ClassSchedule room columns", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(BranchService.getAll).mockResolvedValue([branch] as any);
    vi.mocked(RoomService.getAll).mockResolvedValue([room] as any);
    vi.mocked(StudioService.getMyStudio).mockResolvedValue({
      id: "s1",
      name: "סטודיו",
      schedule_start_hour: 7,
      schedule_end_hour: 23,
    } as any);
  });

  it("places a class in its room column via room_id", async () => {
    vi.mocked(CourseService.getAll).mockResolvedValue([
      makeClass({ name: "יוגה", room_id: ROOM_ID, location_room: "אולם 1" }),
    ] as any);

    renderSchedule();

    await waitFor(() => expect(screen.getByText("יוגה")).toBeInTheDocument());
    expect(screen.getByText("אולם 1")).toBeInTheDocument();
    expect(screen.queryByText("ללא שיבוץ חדר")).not.toBeInTheDocument();
  });

  it("still shows a legacy class whose room name matches no room", async () => {
    // The bug this guards: location_room 'אולם ראשי' with no such room meant the
    // class had no column and disappeared from the schedule entirely.
    vi.mocked(CourseService.getAll).mockResolvedValue([
      makeClass({ name: "פילאטיס", room_id: null, location_room: "אולם ראשי" }),
    ] as any);

    renderSchedule();

    await waitFor(() =>
      expect(screen.getByText("פילאטיס")).toBeInTheDocument()
    );
    expect(screen.getByText("ללא שיבוץ חדר")).toBeInTheDocument();
  });

  it("matches a legacy class by name when it does line up with a room", async () => {
    vi.mocked(CourseService.getAll).mockResolvedValue([
      makeClass({ name: "אופניים", room_id: null, location_room: "אולם 1" }),
    ] as any);

    renderSchedule();

    await waitFor(() =>
      expect(screen.getByText("אופניים")).toBeInTheDocument()
    );
    expect(screen.queryByText("ללא שיבוץ חדר")).not.toBeInTheDocument();
  });

  it("shows classes of the selected day only", async () => {
    vi.mocked(CourseService.getAll).mockResolvedValue([
      makeClass({ name: "יוגה ראשון", day_of_week: 0, room_id: ROOM_ID }),
      makeClass({ name: "פילאטיס רביעי", day_of_week: 3, room_id: ROOM_ID }),
    ] as any);

    renderSchedule();

    await waitFor(() =>
      expect(screen.getByText("יוגה ראשון")).toBeInTheDocument()
    );
    expect(screen.queryByText("פילאטיס רביעי")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "רביעי" }));

    await waitFor(() =>
      expect(screen.getByText("פילאטיס רביעי")).toBeInTheDocument()
    );
    expect(screen.queryByText("יוגה ראשון")).not.toBeInTheDocument();
  });
});
