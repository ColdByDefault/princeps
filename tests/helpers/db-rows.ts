/**
 * Shared DB row fragment types for unit logic tests.
 * Compose these into feature-specific row types to avoid re-declaring common shapes.
 */

export type LabelLinkRow = {
  label: { id: string; name: string; color: string; icon: string | null };
};

export type GoalLinkRow = {
  goal: { id: string; title: string };
};

export type TaskLinkRow = {
  task: { id: string; title: string; status: string };
};
