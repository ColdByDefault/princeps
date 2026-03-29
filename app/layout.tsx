/**
 * @author ColdByDefault
 * @copyright  2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { getRequestConfig } from "@/i18n/request";
import { auth } from "@/lib/auth";
import { Footer, Navbar } from "@/components/navigation";
import { ThemeProvider } from "@/components/theme";
import { NoticeProvider, FloatingNotices } from "@/components/shared";
import { NotificationsProvider } from "@/components/notifications";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ChatWidgetProvider } from "@/components/chat-widget/ChatWidgetProvider";
import { NudgeTrigger } from "@/components/nudges/NudgeTrigger";
import { getUserPreferences } from "@/lib/settings/get.logic";
import "./globals.css";
import { Geist } from "next/font/google";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { language, messages } = await getRequestConfig();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const assistantName = session
    ? (await getUserPreferences(session.user.id)).assistantName
    : undefined;

  return (
    <html
      lang={language}
      suppressHydrationWarning
      className={cn("font-sans", geist.variable)}
    >
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <NoticeProvider>
              <NotificationsProvider authenticated={!!session}>
                <div className="bg-background relative flex h-svh flex-col overflow-hidden">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-15 dark:opacity-25"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at top left, #7c3aed 0%, transparent 38%), radial-gradient(circle at bottom right, #a855f7 0%, transparent 32%)",
                    }}
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-30"
                    style={{
                      backgroundImage:
                        "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
                      backgroundSize: "5rem 5rem",
                    }}
                  />
                  <div
                    aria-hidden
                    className="from-background pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b to-transparent"
                  />
                  <main className="relative flex flex-1 flex-col overflow-hidden">
                    <Navbar
                      messages={messages}
                      sessionUser={
                        session?.user
                          ? {
                              email: session.user.email ?? null,
                              name: session.user.name ?? null,
                              role: session.user.role ?? null,
                            }
                          : null
                      }
                    />
                    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                      {children}
                      <Footer messages={messages} />
                    </div>
                  </main>
                </div>
                <FloatingNotices />
                <Toaster />
                <ChatWidgetProvider
                  authenticated={!!session}
                  assistantName={assistantName}
                />
                <NudgeTrigger authenticated={!!session} />
              </NotificationsProvider>
            </NoticeProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
