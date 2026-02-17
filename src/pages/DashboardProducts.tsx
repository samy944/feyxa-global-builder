import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Plus, Search, Filter, MoreHorizontal, Image as ImageIcon } from "lucide-react";

const products = [
  { name: "T-shirt Premium Coton Bio", price: "€39.00", stock: 124, status: "Actif", category: "Vêtements" },
  { name: "Casquette Brodée Logo", price: "€24.90", stock: 56, status: "Actif", category: "Accessoires" },
  { name: "Sac Tote Canvas", price: "€29.00", stock: 0, status: "Rupture", category: "Accessoires" },
  { name: "Hoodie Oversize Noir", price: "€65.00", stock: 89, status: "Actif", category: "Vêtements" },
  { name: "Poster Art Minimaliste", price: "€19.90", stock: 200, status: "Actif", category: "Déco" },
  { name: "Mug Céramique 350ml", price: "€14.90", stock: 12, status: "Stock bas", category: "Maison" },
];

export default function DashboardProducts() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Produits</h1>
          <p className="text-sm text-muted-foreground mt-1">{products.length} produits dans votre catalogue</p>
        </div>
        <Button variant="hero" size="sm">
          <Plus size={16} />
          Ajouter un produit
        </Button>
      </div>

      {/* Search & filters */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            className="w-full h-9 rounded-lg border border-border bg-card pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter size={14} />
          Filtres
        </Button>
      </div>

      {/* Products table */}
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground text-xs border-b border-border">
              <th className="text-left font-medium p-4">Produit</th>
              <th className="text-left font-medium p-4">Catégorie</th>
              <th className="text-left font-medium p-4">Prix</th>
              <th className="text-left font-medium p-4">Stock</th>
              <th className="text-left font-medium p-4">Statut</th>
              <th className="text-right font-medium p-4"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <motion.tr
                key={p.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors"
              >
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                      <ImageIcon size={16} className="text-muted-foreground" />
                    </div>
                    <span className="font-medium text-foreground">{p.name}</span>
                  </div>
                </td>
                <td className="p-4 text-muted-foreground">{p.category}</td>
                <td className="p-4 font-medium text-foreground">{p.price}</td>
                <td className="p-4 text-foreground">{p.stock}</td>
                <td className="p-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.status === "Actif"
                        ? "bg-accent/10 text-accent"
                        : p.status === "Rupture"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                    <MoreHorizontal size={16} />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
