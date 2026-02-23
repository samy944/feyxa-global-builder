import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import {
  Brain, Send, Loader2, Sparkles, Trash2,
  ShoppingBag, Megaphone, MessageSquare, TrendingUp,
  PenTool, Package, Lightbulb,
} from "lucide-react";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

const quickPrompts = [
  { icon: PenTool, label: "Description produit", prompt: "Rédige une description de produit accrocheuse pour un [produit]. Inclus les bénéfices, les caractéristiques clés et un appel à l'action." },
  { icon: Megaphone, label: "Stratégie marketing", prompt: "Propose-moi une stratégie marketing pour augmenter mes ventes ce mois-ci. Mon budget est limité et je vends principalement via WhatsApp et les réseaux sociaux." },
  { icon: MessageSquare, label: "Message WhatsApp", prompt: "Rédige un message WhatsApp professionnel pour informer un client que sa commande est en cours de livraison." },
  { icon: TrendingUp, label: "Optimiser mes prix", prompt: "Comment optimiser ma stratégie de prix pour maximiser mes marges tout en restant compétitif sur le marché local ?" },
  { icon: ShoppingBag, label: "Idées de produits", prompt: "Quels sont les produits tendance à vendre en ligne en Afrique de l'Ouest en ce moment ?" },
  { icon: Lightbulb, label: "Conseils SEO", prompt: "Donne-moi 5 conseils SEO pratiques pour améliorer la visibilité de ma boutique en ligne." },
];

async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
}: {
  messages: Msg[];
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    onError(body.error || `Erreur ${resp.status}`);
    return;
  }

  if (!resp.body) {
    onError("Pas de réponse du service IA");
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);

      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") break;

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }

  // Flush remaining
  if (buffer.trim()) {
    for (let raw of buffer.split("\n")) {
      if (!raw || !raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }

  onDone();
}

export default function DashboardAI() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: newMessages,
        onDelta: upsertAssistant,
        onDone: () => setIsLoading(false),
        onError: (err) => {
          toast.error(err);
          setIsLoading(false);
        },
      });
    } catch (e) {
      console.error(e);
      toast.error("Erreur de connexion");
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
    toast.success("Conversation effacée");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/20 flex items-center justify-center">
            <Brain size={18} className="text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">Feyxa AI</h1>
            <p className="text-xs text-muted-foreground">Assistant e-commerce intelligent</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearChat} className="text-xs text-muted-foreground">
            <Trash2 size={14} className="mr-1" /> Effacer
          </Button>
        )}
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full"
          >
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <Sparkles size={28} className="text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Comment puis-je vous aider ?</h2>
            <p className="text-sm text-muted-foreground mb-8 text-center max-w-md">
              Je suis votre assistant IA pour optimiser votre boutique, rédiger du contenu et booster vos ventes.
            </p>

            {/* Quick prompts grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-3xl">
              {quickPrompts.map((qp, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => send(qp.prompt)}
                  className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-all text-left group"
                >
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <qp.icon size={14} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{qp.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{qp.prompt.slice(0, 60)}…</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] lg:max-w-[70%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm prose-invert max-w-none text-foreground [&_p]:mb-2 [&_li]:text-foreground [&_strong]:text-foreground [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_code]:bg-secondary [&_code]:px-1 [&_code]:rounded">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-card border border-border rounded-2xl px-4 py-3 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Réflexion en cours…</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input area */}
      <div className="px-6 py-4 border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-end gap-3 max-w-4xl mx-auto">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Posez votre question…"
            className="resize-none text-sm min-h-[44px] max-h-[120px] bg-secondary/50"
            rows={1}
            disabled={isLoading}
          />
          <Button
            size="icon"
            onClick={() => send(input)}
            disabled={!input.trim() || isLoading}
            className="h-11 w-11 shrink-0 rounded-xl"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Feyxa AI peut faire des erreurs. Vérifiez les informations importantes.
        </p>
      </div>
    </div>
  );
}
