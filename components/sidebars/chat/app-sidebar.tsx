/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { SidebarNav } from "./sidebar-nav";
import { SidebarChats } from "./sidebar-chats";
import { SidebarFooterSection } from "./sidebar-footer";
import { useSidebarMutations } from "./logic/useSidebarMutations";

type AppSidebarProps = {
  sessionUser: {
    name: string | null;
    email: string | null;
  } | null;
  tier?: string | null;
};

export function AppSidebar({ sessionUser, tier }: AppSidebarProps) {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  const {
    chats,
    historyLimit,
    creating,
    deleteTarget,
    setDeleteTarget,
    renameTarget,
    setRenameTarget,
    renameValue,
    setRenameValue,
    activeChatId,
    handleNewChat,
    handleDelete,
    handleRename,
    isSigningOut,
    handleSignOut,
    atLimit,
  } = useSidebarMutations();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarNav />
        <SidebarSeparator />
        <SidebarChats
          chats={chats}
          historyLimit={historyLimit}
          creating={creating}
          deleteTarget={deleteTarget}
          setDeleteTarget={setDeleteTarget}
          renameTarget={renameTarget}
          setRenameTarget={setRenameTarget}
          renameValue={renameValue}
          setRenameValue={setRenameValue}
          activeChatId={activeChatId}
          handleNewChat={handleNewChat}
          handleDelete={handleDelete}
          handleRename={handleRename}
          atLimit={atLimit}
          isCollapsed={isCollapsed}
          toggleSidebar={toggleSidebar}
        />
      </SidebarContent>
      <SidebarRail />
      <SidebarFooterSection
        sessionUser={sessionUser}
        tier={tier}
        isCollapsed={isCollapsed}
        isSigningOut={isSigningOut}
        handleSignOut={handleSignOut}
      />
    </Sidebar>
  );
}
