/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 *
 * In-memory registry of active SSE controllers keyed by userId.
 * Safe for single-instance deployments. For multi-instance, replace this
 * module with a Redis pub/sub broadcast mechanism.
 */

import type { Notification } from "@/lib/generated/prisma/client";

type Controller = ReadableStreamDefaultController<Uint8Array>;

const registry = new Map<string, Set<Controller>>();

export function registerController(userId: string, ctrl: Controller): void {
  if (!registry.has(userId)) {
    registry.set(userId, new Set());
  }
  registry.get(userId)!.add(ctrl);
}

export function unregisterController(userId: string, ctrl: Controller): void {
  registry.get(userId)?.delete(ctrl);
  if (registry.get(userId)?.size === 0) {
    registry.delete(userId);
  }
}

export function emitNotification(
  userId: string,
  notification: Notification,
): void {
  const controllers = registry.get(userId);
  if (!controllers || controllers.size === 0) return;

  const payload = `data: ${JSON.stringify(notification)}\n\n`;
  const encoded = new TextEncoder().encode(payload);

  for (const ctrl of controllers) {
    try {
      ctrl.enqueue(encoded);
    } catch {
      // Controller may be closed; cleanup on the next ping cycle
    }
  }
}
