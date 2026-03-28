/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";

export type PersonalInfoFields = Record<string, string | number | null>;

/**
 * Returns the user's PersonalInfo fields, or null if none exist yet.
 */
export async function getPersonalInfo(
  userId: string,
): Promise<PersonalInfoFields | null> {
  const record = await db.personalInfo.findUnique({
    where: { userId },
    select: { fields: true },
  });

  if (!record) return null;
  return record.fields as PersonalInfoFields;
}

/**
 * Upserts the user's PersonalInfo fields JSON.
 * Completely replaces the existing fields with the provided value.
 */
export async function upsertPersonalInfo(
  userId: string,
  fields: PersonalInfoFields,
): Promise<void> {
  await db.personalInfo.upsert({
    where: { userId },
    create: { userId, fields },
    update: { fields },
  });
}
