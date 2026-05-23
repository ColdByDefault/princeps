/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.6
 * @since canary-v1.1.6
 */

"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/core/utils";

interface CardIconButtonProps {
  /** Icon element to render inside the button. Use size-3.5. */
  icon: React.ReactNode;
  /** Used as both aria-label and tooltip text. */
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export function CardIconButton({
  icon,
  label,
  onClick,
  disabled,
  className,
}: CardIconButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={label}
              onClick={onClick}
              disabled={disabled}
              className={cn(
                "size-7 cursor-pointer text-muted-foreground",
                className,
              )}
            />
          }
        >
          {icon}
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
