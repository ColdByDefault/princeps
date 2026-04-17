/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 *
 * Re-exports from next-intl so feature code imports from a single path.
 * Server components:  import { getTranslations } from "@/lib/i18n";
 * Client components:  import { useTranslations } from "next-intl";
 */

export { getTranslations, getLocale } from "next-intl/server";
