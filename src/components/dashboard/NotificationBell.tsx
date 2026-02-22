import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { Bell, Check, TrendingUp, TrendingDown, Package, Flame, Rocket, ShoppingCart, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  metadata: any;
  is_read: boolean;
  created_at: string;
}

export function NotificationBell() {
  const { store } = useStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const fetchNotifications = useCallback(async () => {
    if (!store) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setNotifications(data as Notification[]);
  }, [store]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime subscription
  useEffect(() => {
    if (!store) return;
    const channel = supabase
      .channel("notifications-" + store.id)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `store_id=eq.${store.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [store]);

  async function markAllRead() {
    if (!store) return;
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}j`;
  }

  const typeIcon = (type: string, metadata: any) => {
    if (type === "new_order") return <ShoppingCart size={14} className="text-primary" />;
    if (type === "conversion_alert") return <TrendingDown size={14} className="text-destructive" />;
    const rank = metadata?.rank;
    if (rank && rank <= 3) return <Flame size={14} className="text-amber-500" />;
    if (metadata?.growth > 50) return <Rocket size={14} className="text-primary" />;
    return <TrendingUp size={14} className="text-emerald-500" />;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h4 className="text-sm font-semibold text-foreground">Notifications</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={markAllRead}>
              <Check size={12} /> Tout lire
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length > 0 ? (
            <div className="divide-y divide-border">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "flex gap-3 px-4 py-3 transition-colors",
                    !n.is_read && "bg-primary/5"
                  )}
                >
                  <div className="mt-0.5 shrink-0">{typeIcon(n.type, n.metadata)}</div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className={cn("text-sm", !n.is_read ? "font-semibold text-foreground" : "text-foreground")}>
                      {n.title}
                    </p>
                    {n.body && <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>}
                    <p className="text-[10px] text-muted-foreground">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.is_read && (
                    <div className="mt-1.5 shrink-0">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Package size={24} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Aucune notification</p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
