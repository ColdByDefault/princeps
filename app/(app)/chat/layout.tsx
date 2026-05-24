/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.7
 * @since beta
 */

import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "@/lib/core/i18n";

export default async function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={{ chat: messages.chat }}>
      <div className="flex flex-1 min-h-0 overflow-hidden">{children}</div>
    </NextIntlClientProvider>
  );
}
