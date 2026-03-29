/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState } from "react";
import { TaskList } from "@/components/tasks";
import { getMessage } from "@/lib/i18n";
import type { TaskRecord } from "@/types/api";
import type { MessageDictionary } from "@/types/i18n";

interface TasksViewProps {
  messages: MessageDictionary;
  initialTasks: TaskRecord[];
}

export function TasksView({ messages, initialTasks }: TasksViewProps) {
  const [tasks, setTasks] = useState<TaskRecord[]>(initialTasks);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {getMessage(messages, "tasks.metadata.title", "Tasks")}
      </h1>
      <TaskList messages={messages} tasks={tasks} onTasksChange={setTasks} />
    </div>
  );
}
