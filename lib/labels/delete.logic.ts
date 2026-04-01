/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";

export async function deleteLabel(
  userId: string,
  labelId: string,
): Promise<boolean> {
  const result = await db.label.deleteMany({
    where: {
      id: labelId,
      userId,
    },
  });

  return result.count > 0;
}
