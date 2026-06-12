import type { ReactNode } from "react";
import { ApiStatusBanner } from "@/components/api-status-banner";
import { SideNav } from "@/components/side-nav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <SideNav />
      <main className="min-w-0 md:pl-72">
        <ApiStatusBanner />
        <div className="mx-auto max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
