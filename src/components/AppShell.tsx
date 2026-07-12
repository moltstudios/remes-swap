"use client";

import type { ReactNode } from "react";

/**
 * Minimal layout — header only. No bottom nav, no footer chrome.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-bg">
      {children}
      <footer className="border-t border-ink/5 safe-bottom py-md mt-auto">
        <p className="text-micro text-ink/40 text-center">
          Construido sobre Base · código abierto · sin custodia
        </p>
      </footer>
    </div>
  );
}