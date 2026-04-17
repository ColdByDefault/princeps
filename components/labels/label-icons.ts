/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import {
  Tag,
  Bookmark,
  Star,
  Heart,
  Flag,
  Zap,
  Flame,
  Circle,
  Diamond,
  Shield,
  Crown,
  Trophy,
  Gem,
  Briefcase,
  Lightbulb,
  Globe,
  Clock,
  Bell,
  Target,
  Rocket,
} from "lucide-react";
import { LABEL_ICON_NAMES, type LabelIconName } from "@/lib/labels/label-icons";

export { LABEL_ICON_NAMES, type LabelIconName };

export const LABEL_ICON_MAP = {
  Tag,
  Bookmark,
  Star,
  Heart,
  Flag,
  Zap,
  Flame,
  Circle,
  Diamond,
  Shield,
  Crown,
  Trophy,
  Gem,
  Briefcase,
  Lightbulb,
  Globe,
  Clock,
  Bell,
  Target,
  Rocket,
} as const satisfies Record<
  LabelIconName,
  React.ComponentType<{ className?: string }>
>;
