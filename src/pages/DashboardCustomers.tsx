import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search, Loader2, Users, Mail, Phone, MapPin,
  ShoppingBag, ChevronDown, ChevronUp, Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Customer {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string;
  city: string | null;
  quarter: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  order_count?: number;
  total_spent?: number;
}

export default function DashboardCustomers() {
  const { store } = useStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Record<string, any[]>>({});

  useEffect(() => {
    if (!store?.id) return;
    loadCustomers();
  }, [store?.id]);

  const loadCustomers = async () => {
    if (!store?.id) return;
    setLoading(true);

    const { data: customersData } = await supabase
      .from("customers")
      .select("*")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false });

    if (!customersData) {
      setLoading(false);
      return;
    }

    // Get order stats per customer
    const { data: ordersData } = await supabase
      .from("orders")
      .select("customer_id, total")
      .eq("store_id", store.id)
      .not("customer_id", "is", null);

    const statsMap: Record<string, { count: number; total: number }> = {};
    ordersData?.forEach((o) => {
      if (!o.customer_id) return;
      if (!statsMap[o.customer_id]) statsMap[o.customer_id] = { count: 0, total: 0 };
      statsMap[o.customer_id].count++;
      statsMap[o.customer_id].total += Number(o.total);
    });

    const enriched = customersData.map((c) => ({
      ...c,
      order_count: statsMap[c.id]?.count || 0,
      total_spent: statsMap[c.id]?.total || 0,
    }));

    setCustomers(enriched);
    setLoading(false);
  };

  const loadCustomerOrders = async (customerId: string) => {
    if (customerOrders[customerId]) return;
    const { data } = await supabase
      .from("orders")
      .select("id, order_number, status, total, currency, created_at")
      .eq("store_id", store!.id)
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(10);
    setCustomerOrders((prev) => ({ ...prev, [customerId]: data || [] }));
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      loadCustomerOrders(id);
    }
  };

  const filtered = customers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = `${c.first_name} ${c.last_name || ""}`.toLowerCase();
    return (
      name.includes(q) ||
      c.phone.includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q)
    );
  });

  const formatPrice = (v: number) =>
    store?.currency === "XOF"
      ? `${v.toLocaleString("fr-FR")} FCFA`
      : `€${v.toFixed(2)}`;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

  const statusLabels: Record<string, string> = {
    new: "Nouvelle", confirmed: "Confirmée", packed: "Emballée",
    shipped: "Expédiée", delivered: "Livrée", cancelled: "Annulée",
    refunded: "Remboursée", dispute: "Litige",
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {customers.length} client{customers.length > 1 ? "s" : ""} au total
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total clients", value: customers.length, icon: Users },
          {
            label: "Clients récurrents",
            value: customers.filter((c) => (c.order_count || 0) > 1).length,
            icon: ShoppingBag,
          },
          {
            label: "CA total",
            value: formatPrice(customers.reduce((sum, c) => sum + (c.total_spent || 0), 0)),
            icon: ShoppingBag,
          },
          {
            label: "Panier moyen",
            value: formatPrice(
              customers.reduce((sum, c) => sum + (c.total_spent || 0), 0) /
                Math.max(customers.reduce((sum, c) => sum + (c.order_count || 0), 0), 1)
            ),
            icon: ShoppingBag,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-card p-4"
          >
            <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
            <p className="text-lg font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom, téléphone, email..."
          className="pl-9"
        />
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-foreground font-medium">Aucun client trouvé</p>
          <p className="text-sm text-muted-foreground mt-1">
            Les clients apparaissent automatiquement après leur première commande.
          </p>
        </div>
      )}

      {/* Customer list */}
      <div className="space-y-3">
        {filtered.map((customer, i) => {
          const fullName = `${customer.first_name} ${customer.last_name || ""}`.trim();
          const initials = fullName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
          const isExpanded = expandedId === customer.id;

          return (
            <motion.div
              key={customer.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="rounded-xl border border-border bg-card hover:border-primary/20 transition-colors"
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {initials}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground truncate">
                        {fullName}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {customer.order_count || 0} commande{(customer.order_count || 0) > 1 ? "s" : ""}
                        </Badge>
                        <span className="text-sm font-bold text-foreground">
                          {formatPrice(customer.total_spent || 0)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone size={11} /> {customer.phone}
                      </span>
                      {customer.email && (
                        <span className="flex items-center gap-1">
                          <Mail size={11} /> {customer.email}
                        </span>
                      )}
                      {customer.city && (
                        <span className="flex items-center gap-1">
                          <MapPin size={11} /> {customer.city}
                          {customer.quarter && `, ${customer.quarter}`}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar size={11} /> {formatDate(customer.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                  <Button variant="outline" size="sm" className="text-xs" asChild>
                    <a
                      href={`https://wa.me/${customer.phone.replace(/\s/g, "")}?text=Bonjour ${customer.first_name} !`}
                      target="_blank"
                      rel="noopener"
                    >
                      📱 WhatsApp
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => toggleExpand(customer.id)}
                  >
                    <ShoppingBag size={12} className="mr-1" />
                    Commandes
                    {isExpanded ? (
                      <ChevronUp size={12} className="ml-1" />
                    ) : (
                      <ChevronDown size={12} className="ml-1" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Expanded orders */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 border-t border-border pt-3">
                      <p className="text-xs font-medium text-foreground mb-2">
                        Historique des commandes
                      </p>
                      {!customerOrders[customer.id] ? (
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      ) : customerOrders[customer.id].length === 0 ? (
                        <p className="text-xs text-muted-foreground">Aucune commande</p>
                      ) : (
                        <div className="space-y-2">
                          {customerOrders[customer.id].map((o) => (
                            <div
                              key={o.id}
                              className="flex items-center justify-between text-xs bg-secondary/40 rounded-lg px-3 py-2"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-medium text-foreground">
                                  #{o.order_number}
                                </span>
                                <Badge variant="outline" className="text-[10px]">
                                  {statusLabels[o.status] || o.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-muted-foreground">
                                  {formatDate(o.created_at)}
                                </span>
                                <span className="font-medium text-foreground">
                                  {formatPrice(o.total)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {customer.notes && (
                        <div className="mt-3 p-2 rounded-lg bg-secondary/30">
                          <p className="text-xs text-muted-foreground">
                            <strong>Notes :</strong> {customer.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
