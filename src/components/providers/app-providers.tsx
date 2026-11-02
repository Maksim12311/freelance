"use client";

import type { ReactNode } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

/**
 * App-wide client providers.
 * Theme is fixed to light in layout — no next-themes script injection
 * (React 19 rejects <script> rendered from client components).
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      {children}
      <Toaster richColors closeButton position="top-right" />
    </TooltipProvider>
  );
}
