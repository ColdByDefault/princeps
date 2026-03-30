/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState } from "react";
import { Link2, Copy, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { NoticePanel, useNotice } from "@/components/shared";
import { getMessage } from "@/lib/i18n";
import {
  SHAREABLE_FIELD_KEYS,
  type ShareableFieldKey,
} from "@/lib/share/types";
import type { MessageDictionary } from "@/types/i18n";

interface ActiveToken {
  id: string;
  fields: unknown;
  expiresAt: string | Date;
}

interface ShareLinkPanelProps {
  messages: MessageDictionary;
  initialToken: ActiveToken | null;
}

const FIELD_LABEL_KEYS: Record<ShareableFieldKey, string> = {
  name: "share.field.name",
  email: "share.field.email",
  jobTitle: "share.field.jobTitle",
  company: "share.field.company",
  location: "share.field.location",
  bio: "share.field.bio",
  phone: "share.field.phone",
};

const FIELD_DEFAULTS: Record<ShareableFieldKey, string> = {
  name: "Name",
  email: "Email",
  jobTitle: "Job Title",
  company: "Company",
  location: "Location",
  bio: "Bio",
  phone: "Phone",
};

function getTokenFields(token: ActiveToken | null): ShareableFieldKey[] {
  if (!token) return [];
  const raw = Array.isArray(token.fields) ? token.fields : [];
  return raw.filter((f): f is ShareableFieldKey =>
    (SHAREABLE_FIELD_KEYS as readonly string[]).includes(f as string),
  );
}

export function ShareLinkPanel({
  messages,
  initialToken,
}: ShareLinkPanelProps) {
  const { addNotice } = useNotice();

  const [token, setToken] = useState<ActiveToken | null>(initialToken);
  const [selected, setSelected] = useState<Set<ShareableFieldKey>>(
    () => new Set(getTokenFields(initialToken)),
  );
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleField(key: ShareableFieldKey) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function buildShareUrl(tokenId: string) {
    return `${window.location.origin}/share/${tokenId}`;
  }

  async function handleGenerate() {
    if (selected.size === 0) {
      setError(
        getMessage(
          messages,
          "share.error.noFields",
          "Select at least one field.",
        ),
      );
      return;
    }

    setError(null);
    setGenerating(true);

    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: [...selected] }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to generate link.");
      }

      const data = (await res.json()) as { token: ActiveToken };
      setToken(data.token);

      await navigator.clipboard.writeText(buildShareUrl(data.token.id));
      addNotice({
        type: "success",
        title: getMessage(
          messages,
          "share.copied",
          "Link copied to clipboard!",
        ),
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : getMessage(
              messages,
              "share.error.generate",
              "Failed to generate link.",
            ),
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy() {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(buildShareUrl(token.id));
      addNotice({
        type: "success",
        title: getMessage(
          messages,
          "share.copied",
          "Link copied to clipboard!",
        ),
      });
    } catch {
      setError(
        getMessage(
          messages,
          "share.error.copy",
          "Could not copy to clipboard.",
        ),
      );
    }
  }

  async function handleRevoke() {
    if (!token) return;
    setRevoking(true);
    setError(null);

    try {
      const res = await fetch(`/api/share/${token.id}`, { method: "DELETE" });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to revoke link.");
      }

      setToken(null);
      addNotice({
        type: "success",
        title: getMessage(messages, "share.revoked", "Link revoked."),
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : getMessage(
              messages,
              "share.error.revoke",
              "Failed to revoke link.",
            ),
      );
    } finally {
      setRevoking(false);
    }
  }

  const expiresAt = token
    ? new Date(token.expiresAt).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  return (
    <div className="space-y-5">
      {error && (
        <NoticePanel
          type="error"
          title={error}
          dismissLabel={getMessage(messages, "shared.dismiss", "Dismiss")}
          onDismiss={() => setError(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-2">
        <Link2 className="size-4 text-primary" />
        <h2 className="text-sm font-semibold">
          {getMessage(messages, "share.panel.title", "Share Contact Card")}
        </h2>
      </div>

      <p className="text-xs text-muted-foreground">
        {getMessage(
          messages,
          "share.panel.description",
          "Generate a 24-hour link that shows a public contact card. Choose which fields to include.",
        )}
      </p>

      {/* Field checkboxes */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {SHAREABLE_FIELD_KEYS.map((key) => (
          <label
            key={key}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-sm transition hover:bg-muted/60"
          >
            <Checkbox
              checked={selected.has(key)}
              onCheckedChange={() => toggleField(key)}
            />
            {getMessage(messages, FIELD_LABEL_KEYS[key], FIELD_DEFAULTS[key])}
          </label>
        ))}
      </div>

      {/* Active token display */}
      {token && (
        <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            {getMessage(messages, "share.activeLink", "Active link")}
          </p>
          <p className="truncate rounded-md bg-background/60 px-3 py-1.5 font-mono text-xs text-foreground/80 border border-border/40">
            {buildShareUrl(token.id)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {getMessage(messages, "share.expires", "Expires")}:{" "}
            <span className="font-medium">{expiresAt}</span>
          </p>
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer gap-1.5"
              onClick={() => void handleCopy()}
            >
              <Copy className="size-3.5" />
              {getMessage(messages, "share.copy", "Copy")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer gap-1.5 text-destructive hover:text-destructive"
              onClick={() => void handleRevoke()}
              disabled={revoking}
            >
              <Trash2 className="size-3.5" />
              {revoking
                ? getMessage(messages, "share.revoking", "Revoking…")
                : getMessage(messages, "share.revoke", "Revoke")}
            </Button>
          </div>
        </div>
      )}

      {/* Generate button */}
      <Button
        size="sm"
        className="cursor-pointer gap-1.5"
        onClick={() => void handleGenerate()}
        disabled={generating || selected.size === 0}
      >
        <RefreshCw className={`size-3.5 ${generating ? "animate-spin" : ""}`} />
        {generating
          ? getMessage(messages, "share.generating", "Generating…")
          : token
            ? getMessage(messages, "share.regenerate", "Regenerate Link")
            : getMessage(messages, "share.generate", "Generate Link")}
      </Button>
    </div>
  );
}
