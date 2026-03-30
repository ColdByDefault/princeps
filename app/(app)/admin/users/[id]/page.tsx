/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getAdminUserDetail } from "@/lib/admin/stats.logic";
import { AdminUserActions } from "./AdminUserActions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Detail — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") redirect("/home");

  const { id } = await params;
  const user = await getAdminUserDetail(id);
  if (!user) redirect("/admin");

  const rows: [string, string | number | boolean][] = [
    ["ID", user.id],
    ["Email", user.email],
    ["Name", user.name ?? "—"],
    ["Tier", user.tier],
    ["Role", user.role],
    ["Email verified", String(user.emailVerified)],
    ["Knowledge chars used", user.knowledgeCharsUsed.toLocaleString()],
    ["Knowledge uploads used", user.knowledgeUploadsUsed],
    ["Chats", user.chatCount],
    ["Knowledge docs", user.docCount],
    ["Joined", new Date(user.createdAt).toLocaleString()],
  ];

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← Admin
        </Link>
        <h1 className="text-lg font-semibold">{user.email}</h1>
      </div>

      <div className="mb-6 overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <tbody className="divide-y">
            {rows.map(([label, value]) => (
              <tr key={label} className="hover:bg-muted/20">
                <td className="w-48 px-4 py-2 text-xs font-medium text-muted-foreground">
                  {label}
                </td>
                <td className="px-4 py-2 font-mono text-xs break-all">
                  {String(value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdminUserActions userId={user.id} currentTier={user.tier} />
    </div>
  );
}
