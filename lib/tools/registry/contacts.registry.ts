/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import "server-only";

import type { ToolRegistryEntry } from "../types";

export const contactTools: ToolRegistryEntry[] = [
  {
    minTier: "free",
    group: "contacts",
    type: "function",
    function: {
      name: "create_contact",
      description:
        "Create a new contact for the user. Provide at minimum a name. Optionally include role, company, email, phone, notes, lastContact (ISO date string), and labelNames (string array of label names to attach).",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Full name of the contact." },
          role: {
            type: "string",
            description: "Job title or role of the contact.",
          },
          company: {
            type: "string",
            description: "Company or organisation the contact belongs to.",
          },
          email: { type: "string", description: "Email address." },
          phone: { type: "string", description: "Phone number." },
          notes: {
            type: "string",
            description: "Free-form notes about the contact.",
          },
          lastContact: {
            type: "string",
            description:
              "ISO 8601 date string for when the user last contacted this person.",
          },
          labelNames: {
            type: "array",
            items: { type: "string" },
            description:
              "Label names to attach. Labels will be created if they do not exist.",
          },
        },
        required: ["name"],
      },
    },
  },
  {
    minTier: "free",
    group: "contacts",
    type: "function",
    function: {
      name: "list_contacts",
      description:
        "List all contacts for the current user. Returns names, roles, companies, emails, phone numbers, labels, and IDs needed for update/delete.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    minTier: "free",
    group: "contacts",
    type: "function",
    function: {
      name: "update_contact",
      description:
        "Update an existing contact. Requires the contactId. Supply only the fields that should change. Passing labelNames replaces all existing labels on the contact.",
      parameters: {
        type: "object",
        properties: {
          contactId: {
            type: "string",
            description: "ID of the contact to update.",
          },
          name: { type: "string" },
          role: { type: "string" },
          company: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          notes: { type: "string" },
          lastContact: { type: "string", description: "ISO 8601 date string." },
          labelNames: {
            type: "array",
            items: { type: "string" },
            description:
              "Replacement set of label names. Passing an empty array removes all labels.",
          },
        },
        required: ["contactId"],
      },
    },
  },
  {
    minTier: "free",
    group: "contacts",
    type: "function",
    function: {
      name: "delete_contact",
      description: "Permanently delete a contact. Requires the contactId.",
      parameters: {
        type: "object",
        properties: {
          contactId: {
            type: "string",
            description: "ID of the contact to delete.",
          },
        },
        required: ["contactId"],
      },
    },
  },
];
