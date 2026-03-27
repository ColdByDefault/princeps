/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  registerController,
  unregisterController,
} from "@/lib/notifications/emitter";
import { listNotifications } from "@/lib/notifications/list.logic";

const PING_INTERVAL_MS = 25_000;

// GET /api/notifications/stream — SSE endpoint
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  const encoder = new TextEncoder();

  let ctrl!: ReadableStreamDefaultController<Uint8Array>;
  let pingTimer: ReturnType<typeof setInterval>;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      ctrl = controller;
      registerController(userId, ctrl);

      // Flush any pending notifications on connect
      void listNotifications(userId, 0).then((notifications) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const unread = notifications.filter((item) => item.read === false);
        for (const n of unread) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(n)}\n\n`));
        }
      });

      // Keep the connection alive
      pingTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keep-alive\n\n"));
        } catch {
          clearInterval(pingTimer);
        }
      }, PING_INTERVAL_MS);
    },
    cancel() {
      clearInterval(pingTimer);
      unregisterController(userId, ctrl);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
