/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { z } from "zod";

export const AdminUserPatchSchema = z
  .object({
    tier: z.enum(["free", "pro", "premium"]),
  })
  .strict();
