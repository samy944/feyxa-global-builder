import { Outlet } from "react-router-dom";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { OrderRealtimeListener } from "@/components/dashboard/OrderRealtimeListener";

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <OrderRealtimeListener />
      <div className="flex-1 overflow-x-hidden flex flex-col">
        <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-end px-6 sticky top-0 z-30">
          <NotificationBell />
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
