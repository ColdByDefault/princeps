/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import * as React from "react";

export type NoticeType =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "neutral"
  | "loading";

export interface Notice {
  id: string;
  type: NoticeType;
  title: string;
  message?: string;
  /** Accessible label for the dismiss button — pass a translated string (e.g. "Schließen") */
  dismissLabel?: string;
  duration?: number;
}

interface NoticeContextType {
  notices: Notice[];
  addNotice: (notice: Omit<Notice, "id">) => string;
  removeNotice: (id: string) => void;
}

const NoticeContext = React.createContext<NoticeContextType | undefined>(
  undefined,
);

let noticeCount = 0;

function generateId() {
  noticeCount = (noticeCount + 1) % Number.MAX_SAFE_INTEGER;
  return `notice-${noticeCount}-${Date.now()}`;
}

export function NoticeProvider({ children }: { children: React.ReactNode }) {
  const [notices, setNotices] = React.useState<Notice[]>([]);

  const removeNotice = React.useCallback((id: string) => {
    setNotices((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotice = React.useCallback(
    (notice: Omit<Notice, "id">) => {
      const id = generateId();
      setNotices((prev) => [...prev, { ...notice, id }]);

      if (notice.type !== "loading") {
        const duration = notice.duration ?? 5000;
        setTimeout(() => removeNotice(id), duration);
      }

      return id;
    },
    [removeNotice],
  );

  return (
    <NoticeContext.Provider value={{ notices, addNotice, removeNotice }}>
      {children}
    </NoticeContext.Provider>
  );
}

export function useNotice() {
  const context = React.useContext(NoticeContext);
  if (!context) {
    throw new Error("useNotice must be used within a NoticeProvider");
  }
  return context;
}
