/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";

type UpdateInput = {
  id: string;
  userId: string;
  read?: boolean;
  dismissed?: boolean;
};

export async function updateNotification(input: UpdateInput): Promise<boolean> {
  const data: { read?: boolean; dismissed?: boolean } = {};
  if (input.read !== undefined) data.read = input.read;
  if (input.dismissed !== undefined) data.dismissed = input.dismissed;

  const result = await db.notification.updateMany({
    where: { id: input.id, userId: input.userId },
    data,
  });

  return result.count > 0;
}
