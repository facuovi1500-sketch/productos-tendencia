import type { ReactNode } from "react";
import { ApiStatusBanner } from "@/components/api-status-banner";
import { SideNav } from "@/components/side-nav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <SideNav />
      <main className="md:pl-64">
        <ApiStatusBanner />
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
