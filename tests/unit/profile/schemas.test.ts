import { describe, expect, it } from "vitest";
import { updateProfileSchema } from "@/lib/features/profile/schemas";

describe("updateProfileSchema", () => {
  it("accepts valid profile updates", () => {
    const parsed = updateProfileSchema.safeParse({
      name: "Yazan",
      username: "yazan.dev_1",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects short names and invalid username characters", () => {
    expect(
      updateProfileSchema.safeParse({ name: "Y", username: "bad slug" })
        .success,
    ).toBe(false);
  });
});
