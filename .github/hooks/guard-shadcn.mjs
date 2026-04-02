// Guard: block edits to components/ui/ (Shadcn source files)
import { readFileSync } from "fs";

const input = JSON.parse(readFileSync("/dev/stdin", "utf8"));
const toolName = input.toolName || "";
const filePath = input.toolInput?.filePath || input.toolInput?.path || "";

const isEditTool =
  toolName === "replace_string_in_file" ||
  toolName === "create_file" ||
  toolName === "edit_notebook_file" ||
  toolName === "multi_replace_string_in_file";

const isShadcnFile = filePath.replace(/\\/g, "/").includes("components/ui/");

if (isEditTool && isShadcnFile) {
  const result = {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason:
        "Editing components/ui/ is blocked. These are Shadcn UI source files. Use npx shadcn@latest add <component> instead, or ask for approval.",
    },
  };
  process.stdout.write(JSON.stringify(result));
  process.exit(0);
}

// Allow everything else
process.exit(0);
