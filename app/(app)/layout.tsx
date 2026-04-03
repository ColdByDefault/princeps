/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */


import {
  NoticeProvider,
} from "@/components/shared";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <NoticeProvider>
      {children}
    </NoticeProvider>
  );
}
