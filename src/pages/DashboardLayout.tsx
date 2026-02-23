import { useState } from "react";
import { Outlet } from "react-router-dom";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { OrderRealtimeListener } from "@/components/dashboard/OrderRealtimeListener";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useStore } from "@/hooks/useStore";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function DashboardLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useIsMobile();
  const { store } = useStore();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar — hidden on mobile */}
      {!isMobile && <DashboardSidebar />}

      {/* Mobile drawer overlay */}
      <AnimatePresence>
        {isMobile && drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-[280px]"
            >
              <DashboardSidebar onNavigate={() => setDrawerOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <OrderRealtimeListener />

      <div className="flex-1 overflow-x-hidden flex flex-col min-w-0">
        {/* Header — adaptive */}
        <header
          className="h-14 flex items-center justify-between gap-3 px-4 md:px-6 sticky top-0 z-30"
          style={{
            background: "hsl(var(--background) / 0.85)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid hsl(var(--border))",
          }}
        >
          {/* Left: hamburger (mobile) */}
          <div className="flex items-center gap-3">
            {isMobile && (
              <button
                onClick={() => setDrawerOpen(true)}
                className="h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <Menu size={20} />
              </button>
            )}
            {isMobile && store && (
              <span className="text-sm font-semibold text-foreground truncate max-w-[160px]">
                {store.name}
              </span>
            )}
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <NotificationBell />
          </div>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
