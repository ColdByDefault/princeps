/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { type MessageDictionary } from "@/types/i18n";

export function getMessage(
  messages: MessageDictionary,
  key: string,
  fallback: string,
): string {
  return messages[key] ?? fallback;
}
