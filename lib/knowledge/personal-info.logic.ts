/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { type Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";
import { personalInfoInputSchema } from "@/lib/knowledge/shared.logic";
import { normalizeOptionalText } from "@/lib/security";
import { type PersonalInfoInput } from "@/types/knowledge";

export async function getKnowledgePersonalInfo(userId: string) {
  return prisma.personalInfo.findUnique({
    where: {
      userId,
    },
  });
}

export async function updateKnowledgePersonalInfo(
  userId: string,
  input: PersonalInfoInput,
) {
  const parsedInput = personalInfoInputSchema.parse(input);

  const normalizedInput = {
    ...(parsedInput.fullName !== undefined && {
      fullName: normalizeOptionalText(parsedInput.fullName, 120),
    }),
    ...(parsedInput.dateOfBirth !== undefined && {
      dateOfBirth: normalizeOptionalText(parsedInput.dateOfBirth, 40),
    }),
    ...(parsedInput.phone !== undefined && {
      phone: normalizeOptionalText(parsedInput.phone, 50),
    }),
    ...(parsedInput.address !== undefined && {
      address: normalizeOptionalText(parsedInput.address, 240),
    }),
    ...(parsedInput.occupation !== undefined && {
      occupation: normalizeOptionalText(parsedInput.occupation, 120),
    }),
    ...(parsedInput.bio !== undefined && {
      bio: normalizeOptionalText(parsedInput.bio, 2_000),
    }),
    ...(parsedInput.customFields !== undefined && {
      customFields: parsedInput.customFields.map((field) => ({
        label: field.label.trim(),
        value: field.value.trim(),
      })),
    }),
  };

  return prisma.personalInfo.upsert({
    where: {
      userId,
    },
    create: {
      userId,
      fullName: normalizedInput.fullName ?? null,
      dateOfBirth: normalizedInput.dateOfBirth ?? null,
      phone: normalizedInput.phone ?? null,
      address: normalizedInput.address ?? null,
      occupation: normalizedInput.occupation ?? null,
      bio: normalizedInput.bio ?? null,
      customFields:
        ((normalizedInput.customFields ??
          []) as unknown as Prisma.InputJsonValue) ??
        ([] as unknown as Prisma.InputJsonValue),
    },
    update: {
      fullName: normalizedInput.fullName ?? null,
      dateOfBirth: normalizedInput.dateOfBirth ?? null,
      phone: normalizedInput.phone ?? null,
      address: normalizedInput.address ?? null,
      occupation: normalizedInput.occupation ?? null,
      bio: normalizedInput.bio ?? null,
      ...(normalizedInput.customFields !== undefined && {
        customFields:
          normalizedInput.customFields as unknown as Prisma.InputJsonValue,
      }),
    },
  });
}
