/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getAdminStats, listAdminUsers } from "@/lib/admin/stats.logic";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — See-Sweet",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") redirect("/home");

  const [stats, users] = await Promise.all([getAdminStats(), listAdminUsers()]);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <h1 className="mb-6 text-xl font-semibold">Admin</h1>

      {/* Stats row */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total users", value: stats.totalUsers },
          { label: "Active today", value: stats.activeToday },
          { label: "Total docs", value: stats.totalDocs },
          { label: "Total chats", value: stats.totalChats },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-lg border bg-card px-4 py-3 text-sm"
          >
            <p className="text-muted-foreground text-xs">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Tier breakdown */}
      <div className="mb-6 flex gap-3">
        {stats.tierBreakdown.map((t) => (
          <span
            key={t.tier}
            className="bg-muted rounded px-2 py-1 text-xs font-medium capitalize"
          >
            {t.tier}: {t.count}
          </span>
        ))}
      </div>

      {/* User table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 text-left text-xs text-muted-foreground">
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Tier</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Chars used</th>
              <th className="px-4 py-2 font-medium">Joined</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-muted/30">
                <td className="px-4 py-2 font-mono text-xs">{u.email}</td>
                <td className="px-4 py-2">{u.name ?? "—"}</td>
                <td className="px-4 py-2 capitalize">{u.tier}</td>
                <td className="px-4 py-2 capitalize">{u.role}</td>
                <td className="px-4 py-2 tabular-nums">
                  {u.knowledgeCharsUsed.toLocaleString()}
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {u.createdAt.toLocaleDateString()}
                </td>
                <td className="px-4 py-2">
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="text-primary hover:underline text-xs"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
