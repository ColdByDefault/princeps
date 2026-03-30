/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { resolveShareToken } from "@/lib/share/get.logic";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ tokenId: string }>;
}

export const metadata: Metadata = {
  title: "Contact Card",
  description: "Shared contact card",
  robots: "noindex, nofollow",
};

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  email: "Email",
  jobTitle: "Job Title",
  company: "Company",
  location: "Location",
  bio: "Bio",
  phone: "Phone",
};

export default async function SharePage({ params }: Props) {
  const { tokenId } = await params;
  const data = await resolveShareToken(tokenId);

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="rounded-2xl border border-border/70 bg-card/70 px-8 py-10 text-center shadow-sm backdrop-blur">
          <p className="text-lg font-semibold">Link not found</p>
          <p className="mt-2 text-sm text-muted-foreground">
            This link is invalid or has expired.
          </p>
        </div>
      </main>
    );
  }

  const entries = Object.entries(data.fields);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-border/70 bg-card/70 px-8 py-8 shadow-sm backdrop-blur">
          <p className="mb-6 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Contact Card
          </p>

          {entries.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              No information available.
            </p>
          ) : (
            <dl className="space-y-4">
              {entries.map(([key, value]) => (
                <div key={key}>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {FIELD_LABELS[key] ?? key}
                  </dt>
                  <dd className="mt-0.5 text-sm font-medium wrap-break-word">
                    {key === "email" ? (
                      <a
                        href={`mailto:${value}`}
                        className="text-primary underline underline-offset-2"
                      >
                        {value}
                      </a>
                    ) : (
                      value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          <p className="mt-8 text-center text-[11px] text-muted-foreground/60">
            Shared via See-Sweet · expires in 24 h
          </p>
        </div>
      </div>
    </main>
  );
}
