/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { type MetadataRoute } from "next";

function getSiteUrl(): URL {
  const baseUrl =
    process.env.BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ??
    "http://localhost:3000";

  return new URL(baseUrl);
}

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = new Date();

  return ["/", "/login", "/sign-up"].map((path) => ({
    url: new URL(path, siteUrl).toString(),
    lastModified,
  }));
}
