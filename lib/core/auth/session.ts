/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.2.1
 * @since canary-v1.2.1
 */

import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, type Session } from "@/lib/core/auth/auth";

const getCachedSession = cache(async (): Promise<Session | null> => {
  return auth.api.getSession({ headers: await headers() });
});

export async function getServerSession(): Promise<Session | null> {
  return getCachedSession();
}

export async function requireSession(): Promise<NonNullable<Session>> {
  const session = await getCachedSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}
