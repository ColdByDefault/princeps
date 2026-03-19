/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Chat layout: auth guard + full-height viewport container.
 * All /chat pages inherit the flex full-height structure needed for the
 * sidebar + thread + input layout to fill the space between navbar and footer.
 */
export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  return <div className="flex min-h-0 flex-1 overflow-hidden">{children}</div>;
}

export async function generateMetadata() {
  return { title: "Chat — See-Sweet" };
}
