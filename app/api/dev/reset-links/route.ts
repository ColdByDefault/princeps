/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 */ 

import { NextResponse } from "next/server";
import { getResetLinks } from "@/lib/core/dev/reset-mailbox";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.json({ links: getResetLinks() });
}
