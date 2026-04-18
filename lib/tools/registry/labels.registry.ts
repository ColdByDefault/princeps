/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

import "server-only";

import type { ToolRegistryEntry } from "../types";

export const labelTools: ToolRegistryEntry[] = [
  {
    minTier: "free",
    group: "labels",
    type: "function",
    function: {
      name: "create_label",
      description:
        "Create a new global label. Use this when the user asks to add or create a label. Labels can then be attached to tasks and other records.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Label name (required, max 50 characters).",
          },
          color: {
            type: "string",
            description:
              "Hex color code (e.g. #6366f1). Defaults to #6366f1 if omitted.",
          },
          icon: {
            type: "string",
            description:
              "Optional icon name for the label. One of: Tag, Bookmark, Star, Heart, Flag, Zap, Flame, Circle, Diamond, Shield, Crown, Trophy, Gem, Briefcase, Lightbulb, Globe, Clock, Bell, Target, Rocket.",
          },
        },
        required: ["name"],
      },
    },
  },
  {
    minTier: "free",
    group: "labels",
    type: "function",
    function: {
      name: "list_labels",
      description:
        "Retrieve all labels the user has created. Use this when the user asks what labels exist, or before updating or deleting a label by name.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    minTier: "free",
    group: "labels",
    type: "function",
    function: {
      name: "update_label",
      description:
        "Rename or recolor an existing label. Use when the user asks to rename, edit, or change the color of a label.",
      parameters: {
        type: "object",
        properties: {
          labelName: {
            type: "string",
            description: "The current name of the label to update.",
          },
          newName: {
            type: "string",
            description: "New name for the label (optional).",
          },
          color: {
            type: "string",
            description: "New hex color code, e.g. #f43f5e (optional).",
          },
          icon: {
            type: "string",
            description:
              "New icon name (optional). One of: Tag, Bookmark, Star, Heart, Flag, Zap, Flame, Circle, Diamond, Shield, Crown, Trophy, Gem, Briefcase, Lightbulb, Globe, Clock, Bell, Target, Rocket. Pass null to remove the icon.",
          },
        },
        required: ["labelName"],
      },
    },
  },
  {
    minTier: "free",
    group: "labels",
    type: "function",
    function: {
      name: "delete_label",
      description:
        "Delete an existing label and remove it from all tasks it is attached to. Use when the user asks to remove or delete a label.",
      parameters: {
        type: "object",
        properties: {
          labelName: {
            type: "string",
            description: "The name of the label to delete.",
          },
        },
        required: ["labelName"],
      },
    },
  },
];
