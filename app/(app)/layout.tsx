/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { Navbar, Footer } from "@/components/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const sessionUser = session?.user ?? null;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar sessionUser={sessionUser} />
      <main className="flex-1 flex-col">{children}</main>
      <Footer />
    </div>
  );
}
