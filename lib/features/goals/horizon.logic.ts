/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.4
 * @since beta
 */

import type { GoalRecord } from "@/types/api";

export type HorizonBucket = "now" | "medium" | "long" | "unplaced";

export interface HorizonBuckets {
  now: GoalRecord[];
  medium: GoalRecord[];
  long: GoalRecord[];
  unplaced: GoalRecord[];
}

const NOW_DAYS = 90;
const MEDIUM_DAYS = 90 * 6; // ~18 months upper bound for medium

/**
 * Buckets goals by time horizon based on their targetDate.
 *
 * - now      — targetDate within the next 90 days (or already passed and not done/cancelled)
 * - medium   — targetDate 90 days → 18 months from today
 * - long     — targetDate beyond 18 months
 * - unplaced — no targetDate
 */
export function bucketGoalsByHorizon(
  goals: GoalRecord[],
  now = new Date(),
): HorizonBuckets {
  const buckets: HorizonBuckets = {
    now: [],
    medium: [],
    long: [],
    unplaced: [],
  };

  const nowMs = now.getTime();
  const nowCutoff = nowMs + NOW_DAYS * 86_400_000;
  const mediumCutoff = nowMs + MEDIUM_DAYS * 86_400_000;

  for (const goal of goals) {
    if (!goal.targetDate) {
      buckets.unplaced.push(goal);
      continue;
    }
    const ms = new Date(goal.targetDate).getTime();
    if (ms <= nowCutoff) {
      buckets.now.push(goal);
    } else if (ms <= mediumCutoff) {
      buckets.medium.push(goal);
    } else {
      buckets.long.push(goal);
    }
  }

  return buckets;
}
