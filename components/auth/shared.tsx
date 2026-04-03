/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { type ReactNode } from "react";

type AuthShellProps = {
  title: string;
  subtitle: string;
  form: ReactNode;
  footer: ReactNode;
};

export function AuthShell({ title, subtitle, form, footer }: AuthShellProps) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/75 shadow-2xl shadow-black/10 backdrop-blur">
      <div className="p-6 sm:p-8 lg:p-10">
        <div className="mx-auto w-full max-w-md space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold tracking-tight text-balance">
              {title}
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              {subtitle}
            </p>
          </div>
          {form}
          {footer}
        </div>
      </div>
    </div>
  );
}
