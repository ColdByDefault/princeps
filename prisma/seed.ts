/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "dotenv/config";
import { seedAdmin } from "./seed-admin";
import { prisma as db } from "../lib/db";

async function main() {
  await seedAdmin();
  // Import and run the demo seed when needed:
  // const { default: seedDemo } = await import("./seed-demo");
  // await seedDemo();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
