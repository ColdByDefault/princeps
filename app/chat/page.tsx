/**
 * @author ColdByDefault
 * @copyright  2026 ColdByDefault. All Rights Reserved.
 */
import { AppSidebar, SiteHeader } from "@/components/shared";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getRequestConfig } from "@/i18n/request";

export default async function TestPage() {
  const { messages } = await getRequestConfig();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader messages={messages} />
        <div className="flex flex-1 flex-col overflow-auto">test</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
