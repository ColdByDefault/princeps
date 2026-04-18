/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";

export interface GeocodeSuggestion {
  id: number;
  name: string;
  country: string;
  admin1: string | null;
  latitude: number;
  longitude: number;
}

interface OpenMeteoGeocodeResult {
  id: number;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

interface OpenMeteoGeocodeResponse {
  results?: OpenMeteoGeocodeResult[];
}

/**
 * GET /api/weather/geocode?q=<city-name>
 *
 * Proxies the Open-Meteo geocoding API server-side so that the external call
 * never originates from the client. Requires a valid session.
 */
export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  // Only allow plain text — strip anything that looks like an injection attempt
  if (!/^[\p{L}\p{N}\s'\-,.]+$/u.test(q)) {
    return NextResponse.json({ results: [] });
  }

  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", q);
  url.searchParams.set("count", "8");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ results: [] });
    }

    const data = (await res.json()) as OpenMeteoGeocodeResponse;

    const results: GeocodeSuggestion[] = (data.results ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      country: r.country ?? "",
      admin1: r.admin1 ?? null,
      latitude: r.latitude,
      longitude: r.longitude,
    }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
