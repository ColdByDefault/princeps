/**
 * Seed script — logic layer.
 *
 * Reads fixture data from seed-data.json and writes it to the database.
 * All seed content lives in seed-data.json — this file contains no data.
 *
 * Usage:
 *   npx tsx scripts/seed.ts           — idempotent; skips existing users
 *   npx tsx scripts/seed.ts --reset   — wipes seed users and recreates them
 *
 * Date conventions in seed-data.json:
 *   number (negative)  →  days in the past
 *   number (positive)  →  days in the future
 *   ISO string         →  exact date (e.g. "2026-12-31")
 *   absent / null      →  no date
 */

import { config } from "dotenv";
import { resolve } from "path";
import { createRequire } from "node:module";
import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";

// Load env before importing Prisma
config({ path: resolve(process.cwd(), ".env.local"), quiet: true });
config({ path: resolve(process.cwd(), ".env"), quiet: true });

import { PrismaClient } from "../prisma/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type {
  UserTier,
  MeetingStatus,
  TaskStatus,
  TaskPriority,
  DecisionStatus,
  GoalStatus,
  MemorySource,
  InteractionSource,
} from "../prisma/generated/prisma/enums";

// ─── Fixture data ─────────────────────────────────────────

const require = createRequire(import.meta.url);
const seedData = require("./seed-data.json") as SeedData;

// ─── Types ────────────────────────────────────────────────

interface SeedLabel {
  name: string;
  normalizedName: string;
  color: string;
  icon?: string;
}

interface SeedContact {
  name: string;
  role?: string;
  company?: string;
  email?: string;
  phone?: string;
  notes?: string;
  lastContact?: number;
  labels?: string[];
}

interface SeedMeeting {
  title: string;
  scheduledAt: number;
  durationMin?: number;
  location?: string;
  agenda?: string;
  summary?: string;
  status: string;
  participants?: string[];
  labels?: string[];
}

interface SeedTask {
  title: string;
  notes?: string;
  status: string;
  priority: string;
  dueDate?: number;
  meeting?: string;
  labels?: string[];
}

interface SeedDecision {
  title: string;
  rationale?: string;
  outcome?: string;
  status: string;
  decidedAt?: number;
  meeting?: string;
  labels?: string[];
}

interface SeedMilestone {
  title: string;
  completed: boolean;
}

interface SeedGoal {
  title: string;
  description?: string;
  status: string;
  targetDate?: string;
  milestones?: SeedMilestone[];
  labels?: string[];
  tasks?: string[];
}

interface SeedInteraction {
  contact: string;
  source: "meeting" | "task";
  ref: string;
}

interface SeedMemory {
  key: string;
  value: string;
  source: "user" | "llm";
}

interface SeedUser {
  name: string;
  email: string;
  password: string;
  username: string;
  displayUsername: string;
  timezone: string;
  tier: string;
  preferences: Record<string, unknown>;
  labels: Record<string, SeedLabel>;
  contacts: Record<string, SeedContact>;
  meetings: Record<string, SeedMeeting>;
  tasks: Record<string, SeedTask>;
  decisions: Record<string, SeedDecision>;
  goals: Record<string, SeedGoal>;
  interactions: SeedInteraction[];
  memory: SeedMemory[];
}

interface SeedData {
  users: SeedUser[];
}

// ─── Setup ────────────────────────────────────────────────

const RESET = process.argv.includes("--reset");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("[seed] ✖  DATABASE_URL is not set.");
  process.exit(1);
}

const adapter = new PrismaPg(DATABASE_URL);
const prisma = new PrismaClient({ adapter });

// ─── Password hashing ─────────────────────────────────────
// Matches @better-auth/utils/password.node: `salt(hex):hash(hex)` via scrypt

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: string,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = await scrypt(password.normalize("NFKC"), salt, 64, {
    N: 16384,
    r: 16,
    p: 1,
    maxmem: 128 * 16384 * 16 * 2,
  });
  return `${salt}:${key.toString("hex")}`;
}

// ─── Date helper ──────────────────────────────────────────

function resolveDate(val: number | string | null | undefined): Date | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "number") {
    const d = new Date();
    d.setDate(d.getDate() + val); // negative = past, positive = future
    return d;
  }
  return new Date(val);
}

// ─── Core seeder ─────────────────────────────────────────

async function seedUser(data: SeedUser): Promise<void> {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing) {
    console.log(`[seed] ${data.name} already exists — skipping.`);
    return;
  }

  console.log(`[seed] Creating ${data.name} (${data.tier})...`);

  // User + credential account
  const user = await prisma.user.create({
    data: {
      name: data.name,
      username: data.username,
      displayUsername: data.displayUsername,
      email: data.email,
      emailVerified: true,
      timezone: data.timezone,
      tier: data.tier as UserTier,
      preferences: data.preferences as object,
    },
  });

  await prisma.account.create({
    data: {
      userId: user.id,
      accountId: user.id,
      providerId: "credential",
      password: await hashPassword(data.password),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Labels
  const labelIds: Record<string, string> = {};
  for (const [key, label] of Object.entries(data.labels)) {
    const created = await prisma.label.create({
      data: { userId: user.id, ...label },
    });
    labelIds[key] = created.id;
  }

  // Contacts
  const contactIds: Record<string, string> = {};
  for (const [key, contact] of Object.entries(data.contacts)) {
    const { labels: contactLabels, lastContact, ...rest } = contact;
    const created = await prisma.contact.create({
      data: { userId: user.id, ...rest, lastContact: resolveDate(lastContact) },
    });
    contactIds[key] = created.id;
    for (const lk of contactLabels ?? []) {
      await prisma.labelOnContact.create({
        data: { labelId: labelIds[lk], contactId: created.id },
      });
    }
  }

  // Meetings
  const meetingIds: Record<string, string> = {};
  for (const [key, meeting] of Object.entries(data.meetings)) {
    const {
      labels: meetingLabels,
      participants,
      scheduledAt,
      status,
      ...rest
    } = meeting;
    const created = await prisma.meeting.create({
      data: {
        userId: user.id,
        ...rest,
        status: status as MeetingStatus,
        scheduledAt: resolveDate(scheduledAt)!,
      },
    });
    meetingIds[key] = created.id;
    for (const ck of participants ?? []) {
      await prisma.meetingParticipant.create({
        data: { meetingId: created.id, contactId: contactIds[ck] },
      });
    }
    for (const lk of meetingLabels ?? []) {
      await prisma.labelOnMeeting.create({
        data: { labelId: labelIds[lk], meetingId: created.id },
      });
    }
  }

  // Tasks
  const taskIds: Record<string, string> = {};
  for (const [key, task] of Object.entries(data.tasks)) {
    const {
      labels: taskLabels,
      meeting: taskMeeting,
      dueDate,
      status,
      priority,
      ...rest
    } = task;
    const created = await prisma.task.create({
      data: {
        userId: user.id,
        ...rest,
        status: status as TaskStatus,
        priority: priority as TaskPriority,
        dueDate: resolveDate(dueDate),
        meetingId: taskMeeting ? meetingIds[taskMeeting] : null,
      },
    });
    taskIds[key] = created.id;
    for (const lk of taskLabels ?? []) {
      await prisma.labelOnTask.create({
        data: { labelId: labelIds[lk], taskId: created.id },
      });
    }
  }

  // Decisions
  for (const decision of Object.values(data.decisions)) {
    const {
      labels: decisionLabels,
      meeting: decisionMeeting,
      decidedAt,
      status,
      ...rest
    } = decision;
    const created = await prisma.decision.create({
      data: {
        userId: user.id,
        ...rest,
        status: status as DecisionStatus,
        decidedAt: resolveDate(decidedAt),
        meetingId: decisionMeeting ? meetingIds[decisionMeeting] : null,
      },
    });
    for (const lk of decisionLabels ?? []) {
      await prisma.labelOnDecision.create({
        data: { labelId: labelIds[lk], decisionId: created.id },
      });
    }
  }

  // Goals
  for (const goal of Object.values(data.goals)) {
    const {
      labels: goalLabels,
      tasks: goalTasks,
      milestones,
      targetDate,
      status,
      ...rest
    } = goal;
    const created = await prisma.goal.create({
      data: {
        userId: user.id,
        ...rest,
        status: status as GoalStatus,
        targetDate: targetDate ? new Date(targetDate) : null,
        ...(milestones && {
          milestones: {
            create: milestones.map((m, i) => ({
              title: m.title,
              completed: m.completed,
              position: i,
            })),
          },
        }),
      },
    });
    for (const lk of goalLabels ?? []) {
      await prisma.labelOnGoal.create({
        data: { labelId: labelIds[lk], goalId: created.id },
      });
    }
    for (const tk of goalTasks ?? []) {
      await prisma.taskOnGoal.create({
        data: { goalId: created.id, taskId: taskIds[tk] },
      });
    }
  }

  // Contact interactions
  for (const interaction of data.interactions) {
    const sourceId =
      interaction.source === "meeting"
        ? meetingIds[interaction.ref]
        : taskIds[interaction.ref];
    await prisma.contactInteraction.create({
      data: {
        contactId: contactIds[interaction.contact],
        source: interaction.source as InteractionSource,
        sourceId,
      },
    });
  }

  // Memory entries
  await prisma.memoryEntry.createMany({
    data: data.memory.map((m) => ({
      userId: user.id,
      key: m.key,
      value: m.value,
      source: m.source as MemorySource,
    })),
  });

  console.log(`  [seed] ✔ ${data.name} created.`);
}

// ─── Main ─────────────────────────────────────────────────

async function main() {
  console.log("[seed] Starting...\n");

  if (RESET) {
    const emails = seedData.users.map((u) => u.email);
    console.log("[seed] --reset: deleting existing seed users...");
    await prisma.user.deleteMany({ where: { email: { in: emails } } });
    console.log("[seed] Existing seed users deleted.\n");
  }

  for (const user of seedData.users) {
    await seedUser(user);
  }

  console.log("\n[seed] ✔ Done.");
}

main()
  .catch((err) => {
    console.error("[seed] ✖  Fatal error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
