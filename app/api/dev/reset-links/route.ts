import { NextResponse } from "next/server";
import { getResetLinks } from "@/lib/dev/reset-mailbox";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.json({ links: getResetLinks() });
}
