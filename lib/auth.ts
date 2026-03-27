import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db";
import { generateAndPushNotification } from "@/lib/notifications/generate.logic";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
  },

  // Re-enable social providers here once the environment includes the
  // corresponding client IDs and secrets.
  // socialProviders: {
  //   google: {
  //     clientId: process.env.GOOGLE_CLIENT_ID!,
  //     clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  //   },
  //   github: {
  //     clientId: process.env.GITHUB_CLIENT_ID!,
  //     clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  //   },
  //   microsoft: {
  //     clientId: process.env.MICROSOFT_CLIENT_ID!,
  //     clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
  //   },
  //   apple: {
  //     clientId: process.env.APPLE_CLIENT_ID!,
  //     clientSecret: process.env.APPLE_CLIENT_SECRET!,
  //   },
  // },

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
    },
  },

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          void generateAndPushNotification({
            userId: user.id,
            userName: user.name ?? null,
            locale: "en",
            category: "welcome_signup",
          });
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          // Skip if the session was created within 60 seconds of the user
          // record — sign-up already fires welcome_signup, avoid double-fire.
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { name: true, createdAt: true },
          });

          if (!user) return;

          const ageMs = Date.now() - new Date(user.createdAt).getTime();
          if (ageMs < 60_000) return;

          void generateAndPushNotification({
            userId: session.userId,
            userName: user.name ?? null,
            locale: "en",
            category: "welcome_login",
          });
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
