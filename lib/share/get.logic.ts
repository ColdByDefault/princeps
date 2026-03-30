/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import type { ShareCardData } from "./types";

/**
 * Returns the current active (non-revoked, non-expired) share token for a user,
 * or null if none exists.
 */
export async function getActiveShareToken(userId: string) {
  return db.shareToken.findFirst({
    where: {
      userId,
      revoked: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Resolves a public share token to card data.
 * Returns null if the token doesn't exist, is revoked, or has expired.
 */
export async function resolveShareToken(
  tokenId: string,
): Promise<ShareCardData | null> {
  const token = await db.shareToken.findUnique({
    where: { id: tokenId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!token) return null;
  if (token.revoked) return null;
  if (token.expiresAt < new Date()) return null;

  const requestedFields = Array.isArray(token.fields)
    ? (token.fields as string[])
    : [];

  // Gather all available data: name/email from User + rest from PersonalInfo
  const personalInfo = await db.personalInfo.findUnique({
    where: { userId: token.userId },
    select: { fields: true },
  });
  const piFields =
    personalInfo?.fields &&
    typeof personalInfo.fields === "object" &&
    !Array.isArray(personalInfo.fields)
      ? (personalInfo.fields as Record<string, unknown>)
      : {};

  const allData: Record<string, string> = {};
  if (token.user.name) allData["name"] = token.user.name;
  allData["email"] = token.user.email;
  for (const [k, v] of Object.entries(piFields)) {
    if (v != null && String(v).trim() !== "") {
      allData[k] = String(v);
    }
  }

  // Filter to only the fields the user chose to expose
  const result: Record<string, string> = {};
  for (const key of requestedFields) {
    if (allData[key]) result[key] = allData[key];
  }

  return { fields: result };
}
