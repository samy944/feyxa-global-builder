import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Loader2, Store, Camera } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { VisualSearchDialog } from "@/components/market/VisualSearchDialog";

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: any;
  stores: { name: string; slug: string; currency: string };
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [visualOpen, setVisualOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const navigate = useNavigate();

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("id, name, slug, price, images, stores!inner(name, slug, currency)")
      .eq("is_published", true)
      .eq("is_marketplace_published", true)
      .eq("stores.is_active", true)
      .eq("stores.is_banned", false)
      .ilike("name", `%${q}%`)
      .gt("stock_quantity", 0)
      .order("created_at", { ascending: false })
      .limit(8);
    setResults((data as unknown as SearchResult[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => search(query.trim()), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const formatPrice = (p: number, currency: string) => {
    if (currency === "XOF") return `${p.toLocaleString("fr-FR")} FCFA`;
    return `€${p.toFixed(2)}`;
  };

  const handleSelect = (slug: string) => {
    setOpen(false);
    setQuery("");
    navigate(`/market/product/${slug}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setOpen(false);
      navigate(`/market?q=${encodeURIComponent(query.trim())}`);
      setQuery("");
    }
  };

  const showDropdown = open && query.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <form onSubmit={handleSubmit} className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Rechercher un produit..."
          className="w-full h-9 rounded-lg border border-border bg-secondary/50 pl-9 pr-16 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
        />
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus(); }}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setVisualOpen(true)}
            className="text-muted-foreground hover:text-primary transition-colors p-1 rounded-md hover:bg-primary/10"
            title="Recherche par image"
          >
            <Camera size={15} />
          </button>
        </div>
      </form>

      <VisualSearchDialog open={visualOpen} onOpenChange={setVisualOpen} />

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1.5 z-[60] rounded-xl border border-border bg-popover shadow-lg overflow-hidden"
          >
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={18} className="animate-spin text-primary" />
              </div>
            ) : results.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Aucun résultat pour « {query} »
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {results.map((r) => {
                  const img = Array.isArray(r.images) && r.images.length > 0 ? r.images[0] : null;
                  return (
                    <button
                      key={r.id}
                      onClick={() => handleSelect(r.slug)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent/50 transition-colors text-left"
                    >
                      <div className="h-10 w-10 rounded-md bg-secondary overflow-hidden shrink-0">
                        {img ? (
                          <img src={img} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-muted-foreground/30">
                            <Store size={16} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground font-medium truncate">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.stores.name}</p>
                      </div>
                      <span className="text-sm font-semibold text-foreground shrink-0">
                        {formatPrice(r.price, r.stores.currency)}
                      </span>
                    </button>
                  );
                })}
                <Link
                  to={`/market?q=${encodeURIComponent(query.trim())}`}
                  onClick={() => { setOpen(false); setQuery(""); }}
                  className="block text-center text-xs text-primary py-2.5 hover:bg-accent/30 transition-colors border-t border-border"
                >
                  Voir tous les résultats →
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
