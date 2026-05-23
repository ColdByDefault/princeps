import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TaskRecord } from "@/types/api";
import type { CreateTaskInput } from "@/lib/features/tasks/schemas";
import type * as taskSchemas from "@/lib/features/tasks/schemas";
import type {
  GetSession,
  HeadersProvider,
  RateLimitCheck,
  RateLimitIdentifier,
} from "@/tests/helpers/types";

type TaskStatus = "open" | "in_progress" | "done" | "cancelled";
type ListTasks = (
  userId: string,
  filter?: { status?: TaskStatus },
) => Promise<TaskRecord[]>;
type CreateTask = (
  userId: string,
  input: CreateTaskInput,
) => Promise<TaskRecord>;
type EnforceTasksMax = (
  userId: string,
) => Promise<{ allowed: boolean; reason?: string }>;

const mocks = vi.hoisted(() => ({
  createTask: vi.fn<CreateTask>(),
  enforceTasksMax: vi.fn<EnforceTasksMax>(),
  getRateLimitIdentifier: vi.fn<RateLimitIdentifier>(),
  getSession: vi.fn<GetSession>(),
  headers: vi.fn<HeadersProvider>(),
  listTasks: vi.fn<ListTasks>(),
  rateLimitCheck: vi.fn<RateLimitCheck>(),
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

vi.mock("@/lib/platform/tiers", () => ({
  createTierLimitResponse: (reason = "Plan limit reached.") =>
    Response.json({ error: reason }, { status: 403 }),
  enforceTasksMax: mocks.enforceTasksMax,
}));

vi.mock("@/lib/features/tasks", async () => {
  const actual = await vi.importActual<typeof taskSchemas>(
    "@/lib/features/tasks/schemas",
  );

  return {
    createTask: mocks.createTask,
    createTaskSchema: actual.createTaskSchema,
    listTasks: mocks.listTasks,
  };
});

import { GET, POST } from "@/app/api/tasks/route";

const taskRecord: TaskRecord = {
  id: "task-1",
  title: "Prepare board packet",
  notes: "Draft the decision brief.",
  status: "done",
  priority: "high",
  dueDate: "2026-06-01T08:00:00.000Z",
  meetingId: null,
  meetingTitle: null,
  goals: [],
  labels: [],
  delegatedTo: null,
  delegatedAt: null,
  delegateNotes: null,
  createdAt: "2026-05-08T06:00:00.000Z",
  updatedAt: "2026-05-08T06:30:00.000Z",
};

describe("/api/tasks route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.listTasks.mockResolvedValue([taskRecord]);
    mocks.createTask.mockResolvedValue(taskRecord);
    mocks.rateLimitCheck.mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 0,
    });
    mocks.getRateLimitIdentifier.mockReturnValue("user-1:127.0.0.1");
    mocks.enforceTasksMax.mockResolvedValue({ allowed: true });
  });

  it("lists authenticated user tasks with a validated status filter", async () => {
    const response = await GET(
      new Request("http://localhost/api/tasks?status=done"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ tasks: [taskRecord] });
    expect(mocks.getSession).toHaveBeenCalledTimes(1);
    const sessionArgs = mocks.getSession.mock.calls[0]?.[0];
    expect(sessionArgs?.headers).toBeInstanceOf(Headers);
    expect(mocks.listTasks).toHaveBeenCalledWith("user-1", { status: "done" });
  });

  it("creates a task through auth, rate-limit, tier, validation, and logic layers", async () => {
    const response = await POST(
      new Request("http://localhost/api/tasks", {
        body: JSON.stringify({
          title: "Prepare board packet",
          notes: "Draft the decision brief.",
          priority: "high",
          dueDate: "2026-06-01",
        }),
        headers: {
          "content-type": "application/json",
          "x-real-ip": "127.0.0.1",
        },
        method: "POST",
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ task: taskRecord });
    expect(mocks.getRateLimitIdentifier).toHaveBeenCalledTimes(1);
    const rateLimitIdentifierArgs = mocks.getRateLimitIdentifier.mock.calls[0];
    expect(rateLimitIdentifierArgs?.[0]).toBeInstanceOf(Request);
    expect(rateLimitIdentifierArgs?.[1]).toBe("user-1");
    expect(mocks.rateLimitCheck).toHaveBeenCalledWith("user-1:127.0.0.1");
    expect(mocks.enforceTasksMax).toHaveBeenCalledWith("user-1");
    expect(mocks.createTask).toHaveBeenCalledWith("user-1", {
      title: "Prepare board packet",
      notes: "Draft the decision brief.",
      priority: "high",
      dueDate: "2026-06-01T00:00:00Z",
    });
  });
});
