import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, Search, ShoppingCart } from "lucide-react";

interface OrderRow {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total: number;
  currency: string;
  created_at: string;
  shipping_city: string | null;
  stores: { name: string } | null;
}

const statusLabels: Record<string, string> = {
  new: "Nouveau",
  confirmed: "Confirmé",
  processing: "En cours",
  shipped: "Expédié",
  delivered: "Livré",
  cancelled: "Annulé",
  refunded: "Remboursé",
};

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  new: "secondary",
  confirmed: "outline",
  processing: "outline",
  shipped: "default",
  delivered: "default",
  cancelled: "destructive",
  refunded: "destructive",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("id, order_number, status, payment_status, total, currency, created_at, shipping_city, stores(name)")
      .order("created_at", { ascending: false })
      .limit(500);
    setOrders((data as unknown as OrderRow[]) || []);
    setLoading(false);
  };

  const filtered = orders.filter(
    (o) =>
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      (o.stores as any)?.name?.toLowerCase().includes(search.toLowerCase()) ||
      (o.shipping_city || "").toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat("fr-FR").format(amount) + " " + currency;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <ShoppingCart size={20} className="text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Commandes</h1>
          <p className="text-sm text-muted-foreground">{orders.length} commande{orders.length > 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher par numéro ou boutique..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Commande</TableHead>
                <TableHead>Boutique</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Paiement</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono font-medium text-foreground">
                    #{order.order_number}
                  </TableCell>
                  <TableCell>{(order.stores as any)?.name || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{order.shipping_city || "—"}</TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {formatCurrency(order.total, order.currency)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[order.status] || "outline"}>
                      {statusLabels[order.status] || order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={order.payment_status === "paid" ? "default" : "secondary"}>
                      {order.payment_status === "paid" ? "Payé" : order.payment_status === "pending" ? "En attente" : order.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(order.created_at).toLocaleDateString("fr-FR")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
