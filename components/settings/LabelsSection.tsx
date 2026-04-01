/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState } from "react";
import { Check, Pencil, Plus, Tags, Trash2, X } from "lucide-react";
import { ConfirmDialog } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getMessage } from "@/lib/i18n";
import type { LabelRecord } from "@/types/api";
import type { MessageDictionary } from "@/types/i18n";
import { toast } from "sonner";

type Props = {
  initialLabels: LabelRecord[];
  messages: MessageDictionary;
};

function sortLabels(labels: LabelRecord[]): LabelRecord[] {
  return [...labels].sort((left, right) =>
    left.name.localeCompare(right.name, undefined, { sensitivity: "base" }),
  );
}

export function LabelsSection({ initialLabels, messages }: Props) {
  const [labels, setLabels] = useState<LabelRecord[]>(
    sortLabels(initialLabels),
  );
  const [createName, setCreateName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<LabelRecord | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    const name = createName.trim();
    if (!name) return;

    setSaving(true);
    try {
      const res = await fetch("/api/settings/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = (await res.json()) as
        | { label: LabelRecord }
        | { error?: string };

      if (!res.ok || !("label" in data)) {
        const errorMessage = "error" in data ? data.error : undefined;
        throw new Error(errorMessage || "Failed to create label.");
      }

      setLabels((current) => sortLabels([...current, data.label]));
      setCreateName("");
      toast.success(
        getMessage(messages, "labels.createSuccess", "Label created."),
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : getMessage(
              messages,
              "labels.createError",
              "Failed to create label.",
            ),
      );
    } finally {
      setSaving(false);
    }
  }

  function startEdit(label: LabelRecord) {
    setEditingId(label.id);
    setEditingName(label.name);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingName("");
  }

  async function handleUpdate(labelId: string) {
    const name = editingName.trim();
    if (!name) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/settings/labels/${labelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = (await res.json()) as
        | { label: LabelRecord }
        | { error?: string };

      if (!res.ok || !("label" in data)) {
        const errorMessage = "error" in data ? data.error : undefined;
        throw new Error(errorMessage || "Failed to update label.");
      }

      setLabels((current) =>
        sortLabels(
          current.map((label) => (label.id === labelId ? data.label : label)),
        ),
      );
      cancelEdit();
      toast.success(
        getMessage(messages, "labels.updateSuccess", "Label updated."),
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : getMessage(
              messages,
              "labels.updateError",
              "Failed to update label.",
            ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/settings/labels/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || "Failed to delete label.");
      }

      setLabels((current) =>
        current.filter((label) => label.id !== deleteTarget.id),
      );
      toast.success(
        getMessage(messages, "labels.deleteSuccess", "Label deleted."),
      );
      setDeleteTarget(null);
      if (editingId === deleteTarget.id) {
        cancelEdit();
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : getMessage(
              messages,
              "labels.deleteError",
              "Failed to delete label.",
            ),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <TooltipProvider>
      <div className="space-y-5">
        <div>
          <h2 className="text-sm font-semibold">
            {getMessage(messages, "labels.section.title", "Labels")}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {getMessage(
              messages,
              "labels.section.description",
              "Create reusable labels here first, then apply them across meetings, contacts, tasks, and other records.",
            )}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={createName}
            onChange={(event) => setCreateName(event.target.value)}
            placeholder={getMessage(
              messages,
              "labels.input.placeholder",
              "Add a label like Private or Project Y",
            )}
            maxLength={48}
            disabled={saving}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleCreate();
              }
            }}
          />
          <Button
            type="button"
            onClick={() => void handleCreate()}
            disabled={saving || !createName.trim()}
            className="cursor-pointer"
          >
            <Plus className="size-4" />
            {getMessage(messages, "labels.createAction", "Add label")}
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {labels.length === 1
              ? getMessage(messages, "labels.count.single", "1 label")
              : getMessage(
                  messages,
                  "labels.count.plural",
                  `${labels.length} labels`,
                ).replace("{count}", String(labels.length))}
          </span>
        </div>

        {labels.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-center">
            <div className="mx-auto mb-2 flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Tags className="size-4" />
            </div>
            <p className="text-sm font-medium">
              {getMessage(messages, "labels.empty.title", "No labels yet.")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {getMessage(
                messages,
                "labels.empty.body",
                "Create labels once here so they can become reusable badges across the workspace.",
              )}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {labels.map((label) => {
              const isEditing = editingId === label.id;

              return (
                <div
                  key={label.id}
                  className="flex flex-col gap-3 rounded-xl border border-border/70 bg-background/60 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <Input
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                        maxLength={48}
                        disabled={saving}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            void handleUpdate(label.id);
                          }

                          if (event.key === "Escape") {
                            event.preventDefault();
                            cancelEdit();
                          }
                        }}
                      />
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{label.name}</Badge>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 self-end sm:self-auto">
                    {isEditing ? (
                      <>
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                type="button"
                                size="icon-sm"
                                variant="outline"
                                className="cursor-pointer"
                                onClick={() => void handleUpdate(label.id)}
                                disabled={saving || !editingName.trim()}
                                aria-label={getMessage(
                                  messages,
                                  "labels.saveEditLabel",
                                  "Save label",
                                )}
                              >
                                <Check className="size-4" />
                              </Button>
                            }
                          />
                          <TooltipContent side="top">
                            {getMessage(
                              messages,
                              "labels.saveEditLabel",
                              "Save label",
                            )}
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                type="button"
                                size="icon-sm"
                                variant="ghost"
                                className="cursor-pointer"
                                onClick={cancelEdit}
                                disabled={saving}
                                aria-label={getMessage(
                                  messages,
                                  "labels.cancelEditLabel",
                                  "Cancel edit",
                                )}
                              >
                                <X className="size-4" />
                              </Button>
                            }
                          />
                          <TooltipContent side="top">
                            {getMessage(
                              messages,
                              "labels.cancelEditLabel",
                              "Cancel edit",
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </>
                    ) : (
                      <>
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                type="button"
                                size="icon-sm"
                                variant="ghost"
                                className="cursor-pointer"
                                onClick={() => startEdit(label)}
                                disabled={saving}
                                aria-label={getMessage(
                                  messages,
                                  "labels.editLabel",
                                  "Edit label",
                                )}
                              >
                                <Pencil className="size-4" />
                              </Button>
                            }
                          />
                          <TooltipContent side="top">
                            {getMessage(
                              messages,
                              "labels.editLabel",
                              "Edit label",
                            )}
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                type="button"
                                size="icon-sm"
                                variant="ghost"
                                className="cursor-pointer text-destructive hover:text-destructive"
                                onClick={() => setDeleteTarget(label)}
                                disabled={saving}
                                aria-label={getMessage(
                                  messages,
                                  "labels.deleteLabel",
                                  "Delete label",
                                )}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            }
                          />
                          <TooltipContent side="top">
                            {getMessage(
                              messages,
                              "labels.deleteLabel",
                              "Delete label",
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <ConfirmDialog
          open={deleteTarget !== null}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          title={getMessage(
            messages,
            "labels.deleteConfirmTitle",
            "Delete label?",
          )}
          description={getMessage(
            messages,
            "labels.deleteConfirmBody",
            "This removes the label from your label library. Feature links come later in the next pass.",
          )}
          confirmLabel={getMessage(
            messages,
            "labels.deleteConfirmAction",
            "Delete",
          )}
          cancelLabel={getMessage(messages, "shared.cancel", "Cancel")}
          confirmClassName="bg-destructive/10 text-destructive hover:bg-destructive/20"
          onConfirm={() => void handleDelete()}
        />
      </div>
    </TooltipProvider>
  );
}
