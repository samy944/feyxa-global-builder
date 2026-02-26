import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Loader2, Send, ArrowLeft, MessageCircle, Inbox,
} from "lucide-react";

interface Conversation {
  order_id: string;
  order_number: string;
  customer_name: string;
  last_message: string;
  last_at: string;
  unread: number;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export default function DashboardMessages() {
  const { store } = useStore();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  useEffect(() => {
    if (!store?.id) return;
    fetchConversations();

    const channel = supabase
      .channel("dm-inbox")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages", filter: `store_id=eq.${store.id}` }, () => {
        fetchConversations();
        if (selectedOrderId) fetchMessages(selectedOrderId);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [store?.id]);

  const fetchConversations = async () => {
    setLoading(true);
    // Get all DMs for store, grouped by order
    const { data: dms } = await supabase
      .from("direct_messages")
      .select("order_id, sender_id, content, created_at, is_read")
      .eq("store_id", store!.id)
      .order("created_at", { ascending: false });

    if (!dms || dms.length === 0) { setConversations([]); setLoading(false); return; }

    // Group by order_id
    const orderMap = new Map<string, { msgs: typeof dms; }>();
    (dms as any[]).forEach((m) => {
      if (!orderMap.has(m.order_id)) orderMap.set(m.order_id, { msgs: [] });
      orderMap.get(m.order_id)!.msgs.push(m);
    });

    // Get order details
    const orderIds = Array.from(orderMap.keys());
    const { data: orders } = await supabase
      .from("orders")
      .select("id, order_number, customers(first_name, last_name)")
      .in("id", orderIds);

    const convos: Conversation[] = orderIds.map((oid) => {
      const entry = orderMap.get(oid)!;
      const order = (orders as any[])?.find((o: any) => o.id === oid);
      const customerName = order?.customers
        ? `${order.customers.first_name || ""} ${order.customers.last_name || ""}`.trim()
        : "Client";
      const last = entry.msgs[0];
      const unread = entry.msgs.filter((m: any) => !m.is_read && m.sender_id !== user?.id).length;
      return {
        order_id: oid,
        order_number: order?.order_number || "?",
        customer_name: customerName || "Client",
        last_message: last.content,
        last_at: last.created_at,
        unread,
      };
    });

    convos.sort((a, b) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime());
    setConversations(convos);
    setLoading(false);
  };

  // Fetch messages for selected order
  const fetchMessages = async (orderId: string) => {
    setMessagesLoading(true);
    const { data } = await supabase
      .from("direct_messages")
      .select("id, sender_id, content, is_read, created_at")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });
    setMessages((data as any) || []);
    setMessagesLoading(false);

    // Mark as read
    if (user) {
      const unreadIds = ((data as any[]) || []).filter((m) => m.sender_id !== user.id && !m.is_read).map((m) => m.id);
      if (unreadIds.length > 0) {
        await supabase.from("direct_messages").update({ is_read: true } as any).in("id", unreadIds);
        fetchConversations();
      }
    }
  };

  useEffect(() => {
    if (selectedOrderId) fetchMessages(selectedOrderId);
  }, [selectedOrderId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !selectedOrderId || !store) return;
    setSending(true);
    await supabase.from("direct_messages").insert({
      order_id: selectedOrderId,
      store_id: store.id,
      sender_id: user.id,
      content: newMessage.trim(),
    } as any);
    setNewMessage("");
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const formatTime = (d: string) => new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const formatDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    if (diff < 60000) return "à l'instant";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}min`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return formatDate(d);
  };

  const selectedConvo = conversations.find((c) => c.order_id === selectedOrderId);

  // Group messages by date
  const grouped: { date: string; msgs: Message[] }[] = [];
  messages.forEach((m) => {
    const d = formatDate(m.created_at);
    const last = grouped[grouped.length - 1];
    if (last && last.date === d) last.msgs.push(m);
    else grouped.push({ date: d, msgs: [m] });
  });

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Mobile: show either list or chat
  const showChat = selectedOrderId !== null;
  const showList = !isMobile || !showChat;
  const showChatPanel = !isMobile || showChat;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Conversation List */}
      {showList && (
        <div className={cn("flex flex-col border-r border-border bg-card", isMobile ? "w-full" : "w-80 shrink-0")}>
          <div className="px-4 py-4 border-b border-border">
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Inbox size={18} /> Messages
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">{conversations.length} conversation{conversations.length > 1 ? "s" : ""}</p>
          </div>
          <ScrollArea className="flex-1">
            {conversations.length === 0 ? (
              <div className="text-center py-16">
                <MessageCircle size={32} className="mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">Aucun message</p>
              </div>
            ) : (
              conversations.map((c, i) => (
                <motion.button
                  key={c.order_id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => setSelectedOrderId(c.order_id)}
                  className={cn(
                    "w-full text-left px-4 py-3 border-b border-border transition-colors",
                    selectedOrderId === c.order_id ? "bg-primary/5" : "hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-9 w-9 shrink-0 mt-0.5">
                      <AvatarFallback className="bg-secondary text-foreground text-xs font-bold">
                        {c.customer_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground truncate">{c.customer_name}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{timeAgo(c.last_at)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">#{c.order_number}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{c.last_message}</p>
                    </div>
                    {c.unread > 0 && (
                      <Badge className="bg-primary text-primary-foreground text-[10px] h-5 min-w-5 flex items-center justify-center rounded-full shrink-0">
                        {c.unread}
                      </Badge>
                    )}
                  </div>
                </motion.button>
              ))
            )}
          </ScrollArea>
        </div>
      )}

      {/* Chat Panel */}
      {showChatPanel && (
        <div className="flex-1 flex flex-col min-w-0">
          {!selectedOrderId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle size={40} className="mx-auto text-muted-foreground/20 mb-3" />
                <p className="text-sm text-muted-foreground">Sélectionnez une conversation</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="px-4 py-3 border-b border-border flex items-center gap-3 bg-card">
                {isMobile && (
                  <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setSelectedOrderId(null)}>
                    <ArrowLeft size={18} />
                  </Button>
                )}
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-secondary text-foreground text-xs font-bold">
                    {selectedConvo?.customer_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{selectedConvo?.customer_name}</p>
                  <p className="text-xs text-muted-foreground">Commande #{selectedConvo?.order_number}</p>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 px-4 py-3">
                {messagesLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-sm text-muted-foreground">Aucun message dans cette conversation.</p>
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
                              "max-w-[75%] rounded-2xl px-3.5 py-2",
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

              {/* Input */}
              <div className="border-t border-border px-3 py-3 flex items-center gap-2 bg-card">
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
