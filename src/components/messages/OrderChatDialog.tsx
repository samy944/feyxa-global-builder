import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface OrderChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  storeId: string;
  storeName: string;
  orderNumber: string;
}

export function OrderChatDialog({ open, onOpenChange, orderId, storeId, storeName, orderNumber }: OrderChatDialogProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !orderId) return;
    fetchMessages();

    const channel = supabase
      .channel(`dm-${orderId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages", filter: `order_id=eq.${orderId}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [open, orderId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read
  useEffect(() => {
    if (!open || !user || messages.length === 0) return;
    const unread = messages.filter((m) => m.sender_id !== user.id && !m.is_read).map((m) => m.id);
    if (unread.length > 0) {
      supabase.from("direct_messages").update({ is_read: true } as any).in("id", unread).then();
    }
  }, [messages, open, user]);

  const fetchMessages = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("direct_messages")
      .select("id, sender_id, content, is_read, created_at")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });
    setMessages((data as any) || []);
    setLoading(false);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return;
    setSending(true);
    await supabase.from("direct_messages").insert({
      order_id: orderId,
      store_id: storeId,
      sender_id: user.id,
      content: newMessage.trim(),
    } as any);
    setNewMessage("");
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

  // Group messages by date
  const grouped: { date: string; msgs: Message[] }[] = [];
  messages.forEach((m) => {
    const d = formatDate(m.created_at);
    const last = grouped[grouped.length - 1];
    if (last && last.date === d) last.msgs.push(m);
    else grouped.push({ date: d, msgs: [m] });
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 gap-0">
        <SheetHeader className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {storeName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-sm font-semibold text-foreground truncate">{storeName}</SheetTitle>
              <p className="text-xs text-muted-foreground">Commande #{orderNumber}</p>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4 py-3">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-muted-foreground">Démarrez la conversation avec le vendeur.</p>
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.date}>
                <div className="flex justify-center my-3">
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{group.date}</span>
                </div>
                {group.msgs.map((msg) => {
                  const isMine = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={cn("flex mb-2", isMine ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[80%] rounded-2xl px-3.5 py-2",
                        isMine
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                      )}>
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                        <p className={cn("text-[10px] mt-0.5 text-right", isMine ? "text-primary-foreground/60" : "text-muted-foreground")}>
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </ScrollArea>

        <div className="border-t border-border px-3 py-3 flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écrire un message…"
            className="flex-1 text-sm"
            disabled={sending}
          />
          <Button size="icon" onClick={handleSend} disabled={!newMessage.trim() || sending}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
