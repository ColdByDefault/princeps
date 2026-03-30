"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const TIERS = ["free", "pro", "premium"] as const;

export function AdminUserActions({
  userId,
  currentTier,
}: {
  userId: string;
  currentTier: string;
}) {
  const router = useRouter();
  const [tier, setTier] = useState(currentTier);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleTierSave() {
    setSaving(true);
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier }),
    });
    setSaving(false);
    router.refresh();
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin");
    } else {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Tier override */}
      <div className="rounded-lg border p-4">
        <p className="mb-3 text-sm font-medium">Override tier</p>
        <div className="flex items-center gap-3">
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value)}
            className="rounded border bg-background px-3 py-1.5 text-sm"
          >
            {TIERS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            disabled={saving || tier === currentTier}
            onClick={handleTierSave}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-lg border border-destructive/40 p-4">
        <p className="mb-1 text-sm font-medium text-destructive">Danger zone</p>
        <p className="mb-3 text-xs text-muted-foreground">
          Permanently deletes the user and all their data. This cannot be
          undone.
        </p>
        {!confirmDelete ? (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setConfirmDelete(true)}
          >
            Delete user
          </Button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-xs text-destructive">Are you sure?</span>
            <Button
              size="sm"
              variant="destructive"
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting ? "Deleting…" : "Confirm delete"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmDelete(false)}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
