/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 *
 * Admin seed — creates (or promotes) one admin user from environment variables.
 * Safe to re-run: if the email already exists it just ensures role="admin".
 *
 * Required env vars:
 *   ADMIN_EMAIL     — e.g. admin@example.com
 *   ADMIN_PASSWORD  — used only when creating a new account (min 8 chars)
 *   ADMIN_NAME      — display name (optional, defaults to "Admin")
 *
 * Run standalone:  npm run db:seed-admin
 * Run via seed.ts: imported by prisma/seed.ts
 */

import "dotenv/config";
import { auth } from "../lib/auth";
import { prisma as db } from "../lib/db";

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? "Admin";

  if (!email || !password) {
    console.warn(
      "⚠  ADMIN_EMAIL or ADMIN_PASSWORD not set — skipping admin seed.",
    );
    return;
  }

  console.log(`🔐  Seeding admin: ${email}`);

  const existing = await db.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });

  if (existing) {
    if (existing.role === "admin") {
      console.log("  ↩  Already admin — nothing to do.");
    } else {
      await db.user.update({
        where: { id: existing.id },
        data: { role: "admin" },
      });
      console.log("  ✓  Promoted existing user to admin.");
    }
    return;
  }

  // Create a fresh account via Better Auth so the password is hashed correctly
  const res = await auth.api.signUpEmail({
    body: { name, email, password },
  });

  if (!res.user?.id) {
    throw new Error(`Failed to create admin account for ${email}`);
  }

  await db.user.update({
    where: { id: res.user.id },
    data: {
      role: "admin",
      emailVerified: true,
      preferences: { onboardingDone: true },
    },
  });

  console.log("  ✓  Admin account created.");
}

// Allow running standalone: `npm run db:seed-admin`
if (
  process.argv[1]?.endsWith("seed-admin.ts") ||
  process.argv[1]?.endsWith("seed-admin.js")
) {
  seedAdmin()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => db.$disconnect());
}

export { seedAdmin };
