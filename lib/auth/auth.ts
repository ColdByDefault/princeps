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
    // Email verification is intentionally disabled.
    // No SMTP/email provider is configured, and there is a single known user.
    // `emailVerified` will remain `false` in the DB and is NOT used as an access
    // gate anywhere in the app. If multi-user support or email verification is
    // required in the future, enable Better Auth's `emailVerification` plugin
    // and add a real email provider (e.g. Resend, Nodemailer) before gating any
    // route or feature on this field — otherwise existing accounts will be locked out.
    // TODO (#33): wire up emailVerification plugin + provider when moving to production.
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
