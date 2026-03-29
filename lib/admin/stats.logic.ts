/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";

export interface AdminStats {
  totalUsers: number;
  activeToday: number;
  totalDocs: number;
  totalChats: number;
  tierBreakdown: { tier: string; count: number }[];
}

export async function getAdminStats(): Promise<AdminStats> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [totalUsers, activeToday, totalDocs, totalChats, tierBreakdown] =
    await Promise.all([
      db.user.count(),
      db.session.count({
        where: { updatedAt: { gte: oneDayAgo } },
      }),
      db.knowledgeDocument.count(),
      db.chat.count(),
      db.user.groupBy({
        by: ["tier"],
        _count: { id: true },
      }),
    ]);

  return {
    totalUsers,
    activeToday,
    totalDocs,
    totalChats,
    tierBreakdown: tierBreakdown.map((r) => ({
      tier: r.tier,
      count: r._count.id,
    })),
  };
}

export interface AdminUserRow {
  id: string;
  email: string;
  name: string | null;
  tier: string;
  role: string;
  knowledgeCharsUsed: number;
  createdAt: Date;
}

export async function listAdminUsers(): Promise<AdminUserRow[]> {
  return db.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      tier: true,
      role: true,
      knowledgeCharsUsed: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export interface AdminUserDetail extends AdminUserRow {
  knowledgeUploadsUsed: number;
  emailVerified: boolean;
  preferences: unknown;
  chatCount: number;
  docCount: number;
}

export async function getAdminUserDetail(
  userId: string,
): Promise<AdminUserDetail | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      tier: true,
      role: true,
      knowledgeCharsUsed: true,
      knowledgeUploadsUsed: true,
      emailVerified: true,
      preferences: true,
      createdAt: true,
      _count: { select: { chats: true, knowledgeDocuments: true } },
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    tier: user.tier,
    role: user.role,
    knowledgeCharsUsed: user.knowledgeCharsUsed,
    knowledgeUploadsUsed: user.knowledgeUploadsUsed,
    emailVerified: user.emailVerified,
    preferences: user.preferences,
    createdAt: user.createdAt,
    chatCount: user._count.chats,
    docCount: user._count.knowledgeDocuments,
  };
}
