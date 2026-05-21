import { describe, expect, it } from "vitest";
import {
  createReportSchema,
  reportDetailCallSchema,
} from "@/lib/reports/schemas";

describe("report schemas", () => {
  it("accepts valid report detail call records", () => {
    const parsed = reportDetailCallSchema.safeParse({
      tool: "create_task",
      ok: true,
      kv: {
        title: "Prepare board packet",
        id: "task-1",
      },
    });

    expect(parsed.success).toBe(true);
  });

  it("accepts valid create report input", () => {
    const parsed = createReportSchema.safeParse({
      toolsCalled: ["create_task"],
      toolCallCount: 1,
      tokenUsage: 123,
      details: [
        {
          tool: "create_task",
          ok: true,
          kv: { title: "Prepare board packet" },
        },
      ],
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects invalid count and detail fields", () => {
    expect(
      createReportSchema.safeParse({
        toolsCalled: ["create_task"],
        toolCallCount: -1,
        tokenUsage: 123,
        details: [],
      }).success,
    ).toBe(false);
    expect(
      createReportSchema.safeParse({
        toolsCalled: ["create_task"],
        toolCallCount: 1,
        tokenUsage: -1,
        details: [],
      }).success,
    ).toBe(false);
    expect(
      createReportSchema.safeParse({
        toolsCalled: ["create_task"],
        toolCallCount: 1.5,
        tokenUsage: 123,
        details: [],
      }).success,
    ).toBe(false);
    expect(
      createReportSchema.safeParse({
        toolsCalled: ["create_task"],
        toolCallCount: 1,
        tokenUsage: 123,
        details: [{ tool: "create_task", ok: "yes", kv: {} }],
      }).success,
    ).toBe(false);
  });
});
