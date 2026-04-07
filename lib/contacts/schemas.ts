/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { z } from "zod";

export const createContactSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  role: z.string().max(100, "Role is too long").optional().nullable(),
  company: z.string().max(100, "Company is too long").optional().nullable(),
  email: z
    .string()
    .email("Invalid email address")
    .optional()
    .nullable()
    .or(z.literal("")),
  phone: z.string().max(30, "Phone number is too long").optional().nullable(),
  notes: z.string().max(250, "Notes are too long").optional().nullable(),
  lastContact: z.coerce.date().optional().nullable(),
  labelIds: z.array(z.string()).optional(),
});

export const updateContactSchema = createContactSchema.partial();

export const contactSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  role: z.string().nullable(),
  company: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  notes: z.string().nullable(),
  lastContact: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type Contact = z.infer<typeof contactSchema>;
