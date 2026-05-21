import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TaskRecord } from "@/types/api";
import type { UpdateTaskInput } from "@/lib/features/tasks/schemas";
import type * as taskSchemas from "@/lib/features/tasks/schemas";

type Session = {
  user: {
    id: string;
  };
};

type HeadersProvider = () => Promise<Headers>;
type GetSession = (args: { headers: Headers }) => Promise<Session | null>;
type UpdateTask = (
  taskId: string,
  userId: string,
  input: UpdateTaskInput,
) => Promise<
  | { ok: true; task: TaskRecord }
  | { ok: false; notFound: true }
  | { ok: false; notFound: false; error: string }
>;
type DeleteTask = (
  taskId: string,
  userId: string,
) => Promise<{ ok: boolean }>;
type RateLimitCheck = (
  identifier: string,
) => Promise<{ allowed: boolean; retryAfterSeconds: number }>;
type RateLimitIdentifier = (
  req: Request,
  fallbackIdentifier: string,
) => string;

const mocks = vi.hoisted(() => ({
  deleteTask: vi.fn<DeleteTask>(),
  getRateLimitIdentifier: vi.fn<RateLimitIdentifier>(),
  getSession: vi.fn<GetSession>(),
  headers: vi.fn<HeadersProvider>(),
  rateLimitCheck: vi.fn<RateLimitCheck>(),
  updateTask: vi.fn<UpdateTask>(),
}));

vi.mock("next/headers", () => ({
  headers: mocks.headers,
}));

vi.mock("@/lib/core/auth/auth", () => ({
  auth: {
    api: {
      getSession: mocks.getSession,
    },
  },
}));

vi.mock("@/lib/core/security", () => ({
  createRateLimitResponse: (retryAfterSeconds: number) =>
    Response.json(
      { error: "Too many requests" },
      {
        headers: { "Retry-After": String(retryAfterSeconds) },
        status: 429,
      },
    ),
  getRateLimitIdentifier: mocks.getRateLimitIdentifier,
  writeRateLimiter: {
    check: mocks.rateLimitCheck,
  },
}));

vi.mock("@/lib/features/tasks", async () => {
  const actual = await vi.importActual<typeof taskSchemas>(
    "@/lib/features/tasks/schemas",
  );

  return {
    deleteTask: mocks.deleteTask,
    updateTask: mocks.updateTask,
    updateTaskSchema: actual.updateTaskSchema,
  };
});

import { DELETE, PATCH } from "@/app/api/tasks/[id]/route";

const taskRecord: TaskRecord = {
  id: "task-1",
  title: "Prepare board packet",
  notes: null,
  status: "done",
  priority: "high",
  dueDate: "2026-06-01T08:00:00.000Z",
  meetingId: null,
  meetingTitle: null,
  goals: [],
  labels: [],
  createdAt: "2026-05-08T06:00:00.000Z",
  updatedAt: "2026-05-08T06:30:00.000Z",
};

function params(id = "task-1") {
  return { params: Promise.resolve({ id }) };
}

describe("/api/tasks/[id] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.rateLimitCheck.mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 0,
    });
    mocks.getRateLimitIdentifier.mockReturnValue("user-1:127.0.0.1");
    mocks.updateTask.mockResolvedValue({ ok: true, task: taskRecord });
    mocks.deleteTask.mockResolvedValue({ ok: true });
  });

  it("patches a task through auth, rate-limit, validation, and update layers", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/tasks/task-1", {
        body: JSON.stringify({
          status: "done",
          dueDate: "2026-06-01",
        }),
        headers: {
          "content-type": "application/json",
          "x-real-ip": "127.0.0.1",
        },
        method: "PATCH",
      }),
      params(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ task: taskRecord });
    expect(mocks.getRateLimitIdentifier).toHaveBeenCalledTimes(1);
    expect(mocks.rateLimitCheck).toHaveBeenCalledWith("user-1:127.0.0.1");
    expect(mocks.updateTask).toHaveBeenCalledWith("task-1", "user-1", {
      status: "done",
      dueDate: "2026-06-01T00:00:00Z",
    });
  });

  it("returns 400 for invalid patch input", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/tasks/task-1", {
        body: JSON.stringify({ status: "blocked" }),
        headers: { "content-type": "application/json" },
        method: "PATCH",
      }),
      params(),
    );

    expect(response.status).toBe(400);
    expect(mocks.updateTask).not.toHaveBeenCalled();
  });

  it("returns 404 when patching a missing or unowned task", async () => {
    mocks.updateTask.mockResolvedValue({ ok: false, notFound: true });

    const response = await PATCH(
      new Request("http://localhost/api/tasks/task-1", {
        body: JSON.stringify({ title: "Prepare board packet" }),
        headers: { "content-type": "application/json" },
        method: "PATCH",
      }),
      params(),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Task not found" });
  });

  it("deletes a task through auth, rate-limit, and delete layers", async () => {
    const response = await DELETE(
      new Request("http://localhost/api/tasks/task-1", {
        headers: { "x-real-ip": "127.0.0.1" },
        method: "DELETE",
      }),
      params(),
    );

    expect(response.status).toBe(204);
    expect(mocks.getRateLimitIdentifier).toHaveBeenCalledTimes(1);
    expect(mocks.rateLimitCheck).toHaveBeenCalledWith("user-1:127.0.0.1");
    expect(mocks.deleteTask).toHaveBeenCalledWith("task-1", "user-1");
  });

  it("returns 404 when deleting a missing or unowned task", async () => {
    mocks.deleteTask.mockResolvedValue({ ok: false });

    const response = await DELETE(
      new Request("http://localhost/api/tasks/task-1", { method: "DELETE" }),
      params(),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Task not found" });
  });
});
