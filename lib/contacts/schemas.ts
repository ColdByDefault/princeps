import { z } from "zod";

const dateString = z
  .string()
  .refine((s) => !isNaN(Date.parse(s)), {
    message: "Must be a valid date string.",
  });

export const ContactCreateSchema = z.object({
  name: z.string().min(1, "name is required.").max(255),
  role: z.string().max(255).nullish(),
  company: z.string().max(255).nullish(),
  email: z
    .string()
    .email("email must be a valid email address.")
    .max(255)
    .nullish(),
  phone: z.string().max(50).nullish(),
  notes: z.string().max(5000).nullish(),
  tags: z.array(z.string().max(100)).optional(),
  lastContact: dateString.nullish(),
});

export const ContactUpdateSchema = ContactCreateSchema.partial();
