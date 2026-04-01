/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { z } from "zod";

export const LabelNameSchema = z.string().trim().min(1).max(48);

export const LabelCreateSchema = z
  .object({
    name: LabelNameSchema,
  })
  .strict();

export const LabelUpdateSchema = z
  .object({
    name: LabelNameSchema,
  })
  .strict();
