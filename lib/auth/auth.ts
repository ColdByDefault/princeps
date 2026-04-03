import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
    passwordMinLength: 8,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 3, // 3 days
    updateAge: 60 * 60 * 24, // refresh if older than 1 day
  },

  user: {
    additionalFields: {
      timezone: {
        type: "string",
        defaultValue: "UTC",
      },
      preferences: {
        type: "string",
        defaultValue: "{}",
      },
      role: {
        type: "string",
        defaultValue: "user",
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
