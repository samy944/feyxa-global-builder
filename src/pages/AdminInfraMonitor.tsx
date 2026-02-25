import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RefreshCw, Activity, CheckCircle2, XCircle, Clock, Zap, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface EventLog {
  id: string;
  event_type: string;
  aggregate_type: string;
  aggregate_id: string;
  store_id: string | null;
  status: string;
  retry_count: number;
  max_retries: number;
  error_message: string | null;
  processed_at: string | null;
  created_at: string;
  payload: any;
}

interface HandlerLog {
  id: string;
  event_id: string;
  handler_name: string;
  status: string;
  duration_ms: number | null;
  error_message: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
  processing: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  completed: "bg-green-500/10 text-green-600 border-green-500/30",
  failed: "bg-red-500/10 text-red-600 border-red-500/30",
  max_retries_exceeded: "bg-red-800/10 text-red-800 border-red-800/30",
};

export default function AdminInfraMonitor() {
  const [events, setEvents] = useState<EventLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState<EventLog | null>(null);
  const [handlerLogs, setHandlerLogs] = useState<HandlerLog[]>([]);

  const fetchEvents = async () => {
    setLoading(true);
    let query = supabase
      .from("events_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (filterStatus !== "all") query = query.eq("status", filterStatus);
    if (filterType !== "all") query = query.eq("event_type", filterType);

    const { data } = await query;
    setEvents((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
    // Realtime subscription
    const channel = supabase
      .channel("events-monitor")
      .on("postgres_changes", { event: "*", schema: "public", table: "events_log" }, () => {
        fetchEvents();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [filterStatus, filterType]);

  const openDetail = async (event: EventLog) => {
    setSelectedEvent(event);
    const { data } = await supabase
      .from("event_handlers_log")
      .select("*")
      .eq("event_id", event.id)
      .order("created_at", { ascending: true });
    setHandlerLogs((data as any[]) || []);
  };

  // Stats
  const total = events.length;
  const completed = events.filter((e) => e.status === "completed").length;
  const failed = events.filter((e) => e.status === "failed" || e.status === "max_retries_exceeded").length;
  const pending = events.filter((e) => e.status === "pending" || e.status === "processing").length;
  const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const eventTypes = [...new Set(events.map((e) => e.event_type))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Infrastructure Monitor</h1>
          <p className="text-muted-foreground text-sm">Event Bus & Engine Monitoring</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchEvents} disabled={loading}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Rafraîchir
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Activity size={14} /> Total Events
            </div>
            <p className="text-2xl font-bold">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-green-600 text-xs mb-1">
              <CheckCircle2 size={14} /> Completed
            </div>
            <p className="text-2xl font-bold text-green-600">{completed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-red-600 text-xs mb-1">
              <XCircle size={14} /> Failed
            </div>
            <p className="text-2xl font-bold text-red-600">{failed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Zap size={14} /> Success Rate
            </div>
            <p className="text-2xl font-bold">{successRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="max_retries_exceeded">Max Retries</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {eventTypes.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Events table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Events récents</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Retries</TableHead>
                  <TableHead>Erreur</TableHead>
                  <TableHead>Créé</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetail(event)}>
                    <TableCell>
                      <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{event.event_type}</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_COLORS[event.status] || ""}>
                        {event.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {event.retry_count > 0 && (
                        <span className="flex items-center gap-1 text-amber-600">
                          <AlertTriangle size={12} /> {event.retry_count}/{event.max_retries}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                      {event.error_message || "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(event.created_at), "dd MMM HH:mm:ss", { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="text-xs">Détails</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {events.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {loading ? "Chargement..." : "Aucun événement trouvé"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <code className="text-sm font-mono">{selectedEvent?.event_type}</code>
              {selectedEvent && (
                <Badge variant="outline" className={STATUS_COLORS[selectedEvent.status] || ""}>
                  {selectedEvent.status}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Aggregate ID</span>
                  <p className="font-mono text-xs">{selectedEvent.aggregate_id}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Store ID</span>
                  <p className="font-mono text-xs">{selectedEvent.store_id || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Créé</span>
                  <p>{format(new Date(selectedEvent.created_at), "dd MMM yyyy HH:mm:ss", { locale: fr })}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Traité</span>
                  <p>{selectedEvent.processed_at ? format(new Date(selectedEvent.processed_at), "dd MMM yyyy HH:mm:ss", { locale: fr }) : "—"}</p>
                </div>
              </div>

              {selectedEvent.error_message && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                  <p className="text-xs font-medium text-red-600 mb-1">Dernière erreur</p>
                  <p className="text-xs text-red-500">{selectedEvent.error_message}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium mb-2">Payload</p>
                <pre className="bg-muted rounded-lg p-3 text-xs overflow-x-auto max-h-40">
                  {JSON.stringify(selectedEvent.payload, null, 2)}
                </pre>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Handler Logs ({handlerLogs.length})</p>
                <div className="space-y-2">
                  {handlerLogs.map((h) => (
                    <div key={h.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        {h.status === "success" ? (
                          <CheckCircle2 size={14} className="text-green-600" />
                        ) : h.status === "failed" ? (
                          <XCircle size={14} className="text-red-600" />
                        ) : (
                          <Clock size={14} className="text-muted-foreground" />
                        )}
                        <code className="text-xs font-mono">{h.handler_name}</code>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {h.duration_ms !== null && <span>{h.duration_ms}ms</span>}
                        <Badge variant="outline" className={h.status === "success" ? "text-green-600" : h.status === "failed" ? "text-red-600" : ""}>
                          {h.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {handlerLogs.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-3">Aucun handler log</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
