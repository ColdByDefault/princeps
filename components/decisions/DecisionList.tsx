/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState } from "react";
import { CirclePlus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog, useNotice } from "@/components/shared";
import { getMessage } from "@/lib/i18n";
import { DecisionForm } from "./DecisionForm";
import type { DecisionRecord, LabelOptionRecord } from "@/types/api";
import type { MessageDictionary } from "@/types/i18n";

interface DecisionListProps {
  messages: MessageDictionary;
  decisions: DecisionRecord[];
  availableLabels?: LabelOptionRecord[];
  onDecisionsChange: (decisions: DecisionRecord[]) => void;
}

function statusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "decided") return "default";
  if (status === "reversed") return "destructive";
  return "secondary"; // open
}

export function DecisionList({
  messages,
  decisions,
  availableLabels = [],
  onDecisionsChange,
}: DecisionListProps) {
  const { addNotice } = useNotice();
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DecisionRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  function openCreate() {
    setEditTarget(null);
    setFormOpen(true);
  }

  function openEdit(decision: DecisionRecord) {
    setEditTarget(decision);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/decisions/${deleteTarget}`, {
      method: "DELETE",
    });
    if (res.ok) {
      onDecisionsChange(decisions.filter((d) => d.id !== deleteTarget));
      addNotice({
        type: "success",
        title: getMessage(
          messages,
          "decisions.deleteSuccess",
          "Decision deleted.",
        ),
      });
    } else {
      addNotice({
        type: "error",
        title: getMessage(
          messages,
          "decisions.deleteError",
          "Could not delete decision.",
        ),
      });
    }
    setDeleteTarget(null);
  }

  function handleSaved(decision: DecisionRecord) {
    const exists = decisions.some((d) => d.id === decision.id);
    if (exists) {
      onDecisionsChange(
        decisions.map((d) => (d.id === decision.id ? decision : d)),
      );
      addNotice({
        type: "success",
        title: getMessage(
          messages,
          "decisions.updateSuccess",
          "Decision updated.",
        ),
      });
    } else {
      onDecisionsChange([decision, ...decisions]);
      addNotice({
        type: "success",
        title: getMessage(
          messages,
          "decisions.createSuccess",
          "Decision added.",
        ),
      });
    }
  }

  const open = decisions.filter((d) => d.status === "open");
  const closed = decisions.filter(
    (d) => d.status === "decided" || d.status === "reversed",
  );

  function renderList(items: DecisionRecord[]) {
    return (
      <ul className="divide-y rounded-lg border">
        {items.map((d) => (
          <li
            key={d.id}
            className="flex items-start justify-between gap-4 px-4 py-3"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm truncate">{d.title}</span>
                <Badge
                  variant={statusVariant(d.status)}
                  className="shrink-0 text-xs"
                >
                  {getMessage(
                    messages,
                    `decisions.status.${d.status}` as Parameters<
                      typeof getMessage
                    >[1],
                    d.status,
                  )}
                </Badge>
              </div>
              {d.rationale && (
                <p className="text-muted-foreground text-xs line-clamp-1">
                  {d.rationale}
                </p>
              )}
              {d.outcome && (
                <p className="text-xs line-clamp-1">→ {d.outcome}</p>
              )}
              {d.decidedAt && (
                <p className="text-muted-foreground text-xs">
                  {getMessage(
                    messages,
                    "decisions.field.decidedAt",
                    "Decided on",
                  )}{" "}
                  {new Date(d.decidedAt).toLocaleDateString()}
                </p>
              )}
              {d.labels.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {d.labels.map((label) => (
                    <Badge
                      key={label.id}
                      variant="secondary"
                      className="text-xs"
                    >
                      {label.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 cursor-pointer"
                onClick={() => openEdit(d)}
                aria-label={getMessage(
                  messages,
                  "decisions.editLabel",
                  "Edit decision",
                )}
              >
                <Pencil className="h-3.5 w-3.5" />
                <span className="sr-only">Edit</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 cursor-pointer text-destructive hover:text-destructive"
                onClick={() => setDeleteTarget(d.id)}
                aria-label={getMessage(
                  messages,
                  "decisions.deleteLabel",
                  "Delete decision",
                )}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="sr-only">Delete</span>
              </Button>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm">
          {decisions.length} {decisions.length === 1 ? "decision" : "decisions"}
        </span>
        <Button size="sm" onClick={openCreate}>
          <CirclePlus className="mr-2 h-4 w-4" />
          {getMessage(messages, "decisions.add", "Add decision")}
        </Button>
      </div>

      {decisions.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm font-medium">
            {getMessage(messages, "decisions.empty", "No decisions yet.")}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {getMessage(
              messages,
              "decisions.emptyBody",
              "Log decisions to give the assistant context about what you have decided and why.",
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {open.length > 0 && renderList(open)}
          {closed.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                {getMessage(messages, "decisions.status.decided", "Decided")} /{" "}
                {getMessage(messages, "decisions.status.reversed", "Reversed")}
              </h2>
              {renderList(closed)}
            </div>
          )}
        </div>
      )}

      <DecisionForm
        messages={messages}
        open={formOpen}
        initial={editTarget}
        availableLabels={availableLabels}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
        title={getMessage(
          messages,
          "decisions.deleteTitle",
          "Delete this decision?",
        )}
        description={getMessage(
          messages,
          "decisions.deleteDescription",
          "This will permanently remove the decision record.",
        )}
        confirmLabel={getMessage(messages, "decisions.deleteConfirm", "Delete")}
        cancelLabel={getMessage(messages, "decisions.cancel", "Cancel")}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
