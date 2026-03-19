/**
 * @author ColdByDefault
 * @copyright  2026 ColdByDefault. All Rights Reserved.
 *
 */

import VersionDisplay from "@/components/VersionDisplay";
import { getRequestConfig } from "@/i18n/request";
import { getMessage } from "@/lib/i18n";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { messages } = await getRequestConfig();

  return (
    <div className="flex min-h-[calc(100svh-4rem)] flex-col overflow-hidden px-4 py-4 sm:py-6">
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div className="w-full max-w-6xl min-w-0">{children}</div>
      </div>
      <div className="pt-3">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full border border-black/8 bg-white/35 px-4 py-2 text-[0.72rem] text-muted-foreground backdrop-blur-xl dark:border-white/10 dark:bg-black/20">
          <span className="inline-flex items-center gap-2">
            <VersionDisplay
              className="text-[0.72rem] text-muted-foreground"
              titleLabel={getMessage(
                messages,
                "shell.footer.versionTitle",
                "Application version",
              )}
            />
            <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[0.6rem] font-semibold tracking-[0.18em] text-amber-700 uppercase dark:text-amber-300">
              {getMessage(messages, "shell.footer.beta", "Beta")}
            </span>
          </span>
          <span>
            {getMessage(messages, "shell.footer.copyright", "Copyright")}
          </span>
        </div>
      </div>
    </div>
  );
}
