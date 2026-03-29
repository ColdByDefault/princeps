/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 *
 * Demo seed — 3 test users with realistic meetings, tasks, contacts, and
 * assistant preferences. Safe to re-run: skips existing users by email.
 *
 * Run: npm run db:seed-demo
 */

import "dotenv/config";
import { auth } from "../lib/auth";
import { prisma as db } from "../lib/db";

// ─── Demo user definitions ────────────────────────────────

const DEMO_USERS = [
  {
    name: "Sophie Laurent",
    email: "sophie@demo.see-sweet.dev",
    password: "Demo1234!",
    tier: "pro" as const,
    preferences: {
      onboardingDone: true,
      language: "en",
      assistantName: "Iris",
      systemPrompt:
        "You are Iris, Sophie's executive assistant. Be concise, professional, and always highlight action items.",
      responseStyle: "formal",
      ollamaOptions: {
        temperature: 0.6,
        top_p: 0.85,
        top_k: 40,
        num_ctx: 4096,
        repeat_penalty: 1.05,
      },
    },
  },
  {
    name: "Marcus Webb",
    email: "marcus@demo.see-sweet.dev",
    password: "Demo1234!",
    tier: "free" as const,
    preferences: {
      onboardingDone: true,
      language: "en",
      assistantName: "Atlas",
      systemPrompt:
        "You are Atlas, Marcus's personal assistant. Keep responses short and action-focused.",
      responseStyle: "concise",
      ollamaOptions: {
        temperature: 0.8,
        top_p: 0.9,
        top_k: 40,
        num_ctx: 2048,
        repeat_penalty: 1.1,
      },
    },
  },
  {
    name: "Lena Fischer",
    email: "lena@demo.see-sweet.dev",
    password: "Demo1234!",
    tier: "premium" as const,
    preferences: {
      onboardingDone: true,
      language: "de",
      assistantName: "Nova",
      systemPrompt:
        "Du bist Nova, Lenas persönliche KI-Assistentin. Antworte auf Deutsch, präzise und strukturiert.",
      responseStyle: "detailed",
      ollamaOptions: {
        temperature: 0.7,
        top_p: 0.92,
        top_k: 50,
        num_ctx: 8192,
        repeat_penalty: 1.0,
      },
    },
  },
] as const;

// ─── Per-user seed data ───────────────────────────────────

const SEED_DATA: Record<
  string,
  {
    contacts: Array<{
      name: string;
      role?: string;
      company?: string;
      email?: string;
      phone?: string;
      notes?: string;
    }>;
    meetings: Array<{
      title: string;
      scheduledAt: Date;
      durationMin: number;
      location?: string;
      agenda?: string;
      status: string;
      participantIndexes: number[];
    }>;
    tasks: Array<{
      title: string;
      notes?: string;
      status: string;
      priority: string;
      dueDate?: Date;
    }>;
  }
> = {
  "sophie@demo.see-sweet.dev": {
    contacts: [
      {
        name: "James Thornton",
        role: "Head of Product",
        company: "Nexlayer",
        email: "james.thornton@nexlayer.io",
        notes: "Key decision-maker for Q2 roadmap sign-off.",
      },
      {
        name: "Aria Patel",
        role: "Legal Counsel",
        company: "Nexlayer",
        email: "aria.patel@nexlayer.io",
        phone: "+49 30 123 456",
        notes: "Handles contracts and NDAs.",
      },
      {
        name: "Tom Reiter",
        role: "CTO",
        company: "Cloudspire",
        email: "tom.reiter@cloudspire.com",
        notes: "Potential integration partner.",
      },
    ],
    meetings: [
      {
        title: "Q2 Roadmap Review",
        scheduledAt: new Date("2026-04-07T10:00:00Z"),
        durationMin: 60,
        location: "Board Room A",
        agenda:
          "Review Q1 delivery, align on Q2 priorities, agree resource allocation.",
        status: "upcoming",
        participantIndexes: [0, 1],
      },
      {
        title: "Partnership Kick-off — Cloudspire",
        scheduledAt: new Date("2026-04-14T14:30:00Z"),
        durationMin: 45,
        location: "Video call",
        agenda: "Explore API integration, agree on NDA timeline.",
        status: "upcoming",
        participantIndexes: [2],
      },
      {
        title: "Weekly Sync",
        scheduledAt: new Date("2026-03-24T09:00:00Z"),
        durationMin: 30,
        status: "done",
        participantIndexes: [0],
      },
    ],
    tasks: [
      {
        title: "Send updated product spec to James",
        status: "open",
        priority: "high",
        dueDate: new Date("2026-04-03"),
      },
      {
        title: "Review NDA draft from Aria",
        status: "in_progress",
        priority: "high",
        dueDate: new Date("2026-04-05"),
      },
      {
        title: "Prepare integration brief for Cloudspire call",
        status: "open",
        priority: "normal",
        dueDate: new Date("2026-04-12"),
      },
      {
        title: "Archive Q1 meeting notes",
        status: "done",
        priority: "low",
      },
    ],
  },

  "marcus@demo.see-sweet.dev": {
    contacts: [
      {
        name: "Priya Nair",
        role: "Marketing Director",
        company: "BrightWave",
        email: "priya@brightwave.co",
        notes: "Leads demand-gen campaigns.",
      },
      {
        name: "Daniel Kim",
        role: "Engineer",
        company: "BrightWave",
        email: "d.kim@brightwave.co",
      },
    ],
    meetings: [
      {
        title: "Campaign Planning — Summer Launch",
        scheduledAt: new Date("2026-04-10T11:00:00Z"),
        durationMin: 60,
        location: "Zoom",
        agenda: "Define targeting, set KPIs, review creative brief.",
        status: "upcoming",
        participantIndexes: [0],
      },
      {
        title: "Engineering stand-up",
        scheduledAt: new Date("2026-03-28T09:30:00Z"),
        durationMin: 15,
        status: "upcoming",
        participantIndexes: [1],
      },
    ],
    tasks: [
      {
        title: "Share audience segment data with Priya",
        status: "open",
        priority: "high",
        dueDate: new Date("2026-04-02"),
      },
      {
        title: "Review analytics dashboard access",
        status: "open",
        priority: "normal",
      },
      {
        title: "Draft meeting agenda for Summer Launch",
        status: "done",
        priority: "normal",
      },
    ],
  },

  "lena@demo.see-sweet.dev": {
    contacts: [
      {
        name: "Felix Braun",
        role: "Investor",
        company: "Alpen Ventures",
        email: "felix.braun@alpen.vc",
        notes: "Lead investor, monthly check-ins.",
      },
      {
        name: "Johanna Meyer",
        role: "CFO",
        company: "NordTech GmbH",
        email: "johanna.meyer@nordtech.de",
        phone: "+49 40 987 654",
        notes: "Finance contact for Series A.",
      },
      {
        name: "Samuel Osei",
        role: "Head of Sales",
        company: "NordTech GmbH",
        email: "s.osei@nordtech.de",
      },
    ],
    meetings: [
      {
        title: "Investor Update — April",
        scheduledAt: new Date("2026-04-08T15:00:00Z"),
        durationMin: 30,
        location: "Google Meet",
        agenda: "MRR progress, burn rate, next milestone.",
        status: "upcoming",
        participantIndexes: [0],
      },
      {
        title: "Series A Prep — Finance Review",
        scheduledAt: new Date("2026-04-15T10:00:00Z"),
        durationMin: 90,
        location: "Hamburg HQ",
        agenda: "Review last 12-month P&L, stress-test projections.",
        status: "upcoming",
        participantIndexes: [1],
      },
      {
        title: "Sales Pipeline Review",
        scheduledAt: new Date("2026-03-20T13:00:00Z"),
        durationMin: 45,
        status: "done",
        participantIndexes: [1, 2],
      },
    ],
    tasks: [
      {
        title: "Update investor deck with March numbers",
        status: "in_progress",
        priority: "urgent",
        dueDate: new Date("2026-04-07"),
      },
      {
        title: "Reconcile Q1 expenses with Johanna",
        status: "open",
        priority: "high",
        dueDate: new Date("2026-04-10"),
      },
      {
        title: "Draft Series A one-pager",
        status: "open",
        priority: "high",
        dueDate: new Date("2026-04-20"),
      },
      {
        title: "Send pipeline report to Felix",
        status: "done",
        priority: "normal",
      },
    ],
  },
};

// ─── Helpers ─────────────────────────────────────────────

async function upsertUser(
  user: (typeof DEMO_USERS)[number],
): Promise<string | null> {
  const existing = await db.user.findUnique({
    where: { email: user.email },
    select: { id: true },
  });
  if (existing) {
    console.log(`  ↩  ${user.email} already exists — skipping sign-up`);
    return existing.id;
  }

  const res = await auth.api.signUpEmail({
    body: { name: user.name, email: user.email, password: user.password },
  });

  if (!res.user?.id) {
    console.error(`  ✗  Failed to create user ${user.email}`);
    return null;
  }

  return res.user.id;
}

// ─── Main ─────────────────────────────────────────────────

async function main() {
  console.log("🌱  Seeding demo users…\n");

  for (const userDef of DEMO_USERS) {
    console.log(`👤  ${userDef.name} <${userDef.email}>`);

    const userId = await upsertUser(userDef);
    if (!userId) continue;

    // Patch tier + preferences
    await db.user.update({
      where: { id: userId },
      data: {
        tier: userDef.tier,
        preferences: userDef.preferences,
        emailVerified: true,
      },
    });
    console.log(
      `  ✓  tier=${userDef.tier}  assistant=${userDef.preferences.assistantName}`,
    );

    const seedData = SEED_DATA[userDef.email];
    if (!seedData) continue;

    // Contacts
    const contactIds: string[] = [];
    for (const contactDef of seedData.contacts) {
      const existing = await db.contact.findFirst({
        where: { userId, email: contactDef.email ?? "" },
        select: { id: true },
      });
      if (existing) {
        contactIds.push(existing.id);
        continue;
      }
      const contact = await db.contact.create({
        data: { userId, ...contactDef },
        select: { id: true },
      });
      contactIds.push(contact.id);
    }
    console.log(`  ✓  ${contactIds.length} contacts`);

    // Meetings + participants
    let meetingCount = 0;
    for (const meetingDef of seedData.meetings) {
      const { participantIndexes, ...meetingFields } = meetingDef;
      const existing = await db.meeting.findFirst({
        where: { userId, title: meetingDef.title },
        select: { id: true },
      });
      if (existing) continue;

      const meeting = await db.meeting.create({
        data: {
          userId,
          ...meetingFields,
          participants: {
            create: participantIndexes
              .filter((i) => contactIds[i] !== undefined)
              .map((i) => ({ contactId: contactIds[i] })),
          },
        },
        select: { id: true },
      });
      meetingCount++;
      void meeting;
    }
    console.log(`  ✓  ${meetingCount} meetings`);

    // Tasks
    let taskCount = 0;
    for (const taskDef of seedData.tasks) {
      const existing = await db.task.findFirst({
        where: { userId, title: taskDef.title },
        select: { id: true },
      });
      if (existing) continue;
      await db.task.create({ data: { userId, ...taskDef } });
      taskCount++;
    }
    console.log(`  ✓  ${taskCount} tasks\n`);
  }

  console.log("✅  Demo seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
