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
import { TaskForm } from "./TaskForm";
import type { LabelOptionRecord, TaskRecord } from "@/types/api";
import type { MessageDictionary } from "@/types/i18n";

interface TaskListProps {
  messages: MessageDictionary;
  tasks: TaskRecord[];
  availableLabels?: LabelOptionRecord[];
  onTasksChange: (tasks: TaskRecord[]) => void;
}

function priorityVariant(
  priority: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (priority === "urgent") return "destructive";
  if (priority === "high") return "default";
  if (priority === "normal") return "secondary";
  return "outline";
}

const STATUS_ORDER = ["open", "in_progress", "done", "cancelled"];

export function TaskList({
  messages,
  tasks,
  availableLabels = [],
  onTasksChange,
}: TaskListProps) {
  const { addNotice } = useNotice();
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TaskRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  function openCreate() {
    setEditTarget(null);
    setFormOpen(true);
  }

  function openEdit(task: TaskRecord) {
    setEditTarget(task);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/tasks/${deleteTarget}`, { method: "DELETE" });
    if (res.ok) {
      onTasksChange(tasks.filter((t) => t.id !== deleteTarget));
      addNotice({
        type: "success",
        title: getMessage(messages, "tasks.deleteSuccess", "Task deleted."),
      });
    } else {
      addNotice({
        type: "error",
        title: getMessage(
          messages,
          "tasks.deleteError",
          "Could not delete task.",
        ),
      });
    }
    setDeleteTarget(null);
  }

  // Group active vs finished
  const active = tasks.filter(
    (t) => t.status === "open" || t.status === "in_progress",
  );
  const finished = tasks.filter(
    (t) => t.status === "done" || t.status === "cancelled",
  );

  function renderList(items: TaskRecord[]) {
    const sorted = [...items].sort(
      (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status),
    );
    return (
      <ul className="divide-y rounded-lg border">
        {sorted.map((task) => (
          <li
            key={task.id}
            className="flex items-start justify-between gap-4 px-4 py-3"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`font-medium text-sm truncate ${
                    task.status === "done" || task.status === "cancelled"
                      ? "line-through text-muted-foreground"
                      : ""
                  }`}
                >
                  {task.title}
                </span>
                <Badge
                  variant={priorityVariant(task.priority)}
                  className="shrink-0 text-xs"
                >
                  {getMessage(
                    messages,
                    `tasks.priority.${task.priority}` as Parameters<
                      typeof getMessage
                    >[1],
                    task.priority,
                  )}
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs">
                {getMessage(
                  messages,
                  `tasks.status.${task.status}` as Parameters<
                    typeof getMessage
                  >[1],
                  task.status,
                )}
                {task.dueDate &&
                  ` · due ${new Date(task.dueDate).toLocaleDateString()}`}
              </p>
              {task.notes && (
                <p className="text-muted-foreground text-xs line-clamp-1">
                  {task.notes}
                </p>
              )}
              {task.labels.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {task.labels.map((label) => (
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
                className="h-7 w-7 cursor-pointer text-muted-foreground hover:text-foreground"
                onClick={() => openEdit(task)}
              >
                <Pencil className="h-3.5 w-3.5" />
                <span className="sr-only">Edit</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 cursor-pointer text-destructive hover:text-destructive"
                onClick={() => setDeleteTarget(task.id)}
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
          {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
        </span>
        <Button size="sm" onClick={openCreate}>
          <CirclePlus className="mr-2 h-4 w-4" />
          {getMessage(messages, "tasks.add", "Add task")}
        </Button>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm font-medium">
            {getMessage(messages, "tasks.empty", "No tasks yet.")}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {getMessage(
              messages,
              "tasks.emptyBody",
              "Add tasks to track what needs to get done.",
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && renderList(active)}
          {finished.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                Finished
              </h2>
              {renderList(finished)}
            </div>
          )}
        </div>
      )}

      <TaskForm
        messages={messages}
        open={formOpen}
        initial={editTarget}
        availableLabels={availableLabels}
        onClose={() => setFormOpen(false)}
        onSaved={(task) => {
          onTasksChange(
            editTarget
              ? tasks.map((t) => (t.id === task.id ? task : t))
              : [task, ...tasks],
          );
          setFormOpen(false);
          addNotice({
            type: "success",
            title: getMessage(
              messages,
              editTarget ? "tasks.updateSuccess" : "tasks.createSuccess",
              editTarget ? "Task updated." : "Task added.",
            ),
          });
        }}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
        title={getMessage(messages, "tasks.deleteTitle", "Delete this task?")}
        description={getMessage(
          messages,
          "tasks.deleteDescription",
          "This will permanently remove the task.",
        )}
        confirmLabel={getMessage(messages, "tasks.deleteConfirm", "Delete")}
        cancelLabel={getMessage(messages, "tasks.cancel", "Cancel")}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
