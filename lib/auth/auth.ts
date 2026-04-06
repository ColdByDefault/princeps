import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { username } from "better-auth/plugins";
import { prisma } from "@/lib/db";
import { storeResetLink } from "@/lib/dev/reset-mailbox";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  plugins: [
    username({
      minUsernameLength: 3,
      maxUsernameLength: 30,
    }),
  ],

  emailAndPassword: {
    enabled: true,
    passwordMinLength: 8,
    // TODO: Replace with a real email provider (e.g. nodemailer, Resend) before going to production.
    // Set RESET_PASSWORD_FROM_EMAIL and configure SMTP/API credentials in env.
    sendResetPassword: async ({ user, url }) => {
      console.log(
        `[Password Reset] Reset link for ${user.email}:\n${url}\n(Configure an email provider to send this automatically.)`,
      );
      if (process.env.NODE_ENV === "development") {
        storeResetLink(user.email, url);
      }
    },
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
      tier: {
        type: "string",
        defaultValue: "free",
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
