import { Outlet } from "react-router-dom";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { OrderRealtimeListener } from "@/components/dashboard/OrderRealtimeListener";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <OrderRealtimeListener />
      <div className="flex-1 overflow-x-hidden flex flex-col">
        <header
          className="h-14 flex items-center justify-end gap-3 px-6 sticky top-0 z-30"
          style={{
            background: "hsl(var(--background) / 0.85)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid hsl(var(--border))",
          }}
        >
          <ThemeToggle compact />
          <NotificationBell />
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
