import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Globe, Save } from "lucide-react";
import { toast } from "sonner";

interface Props {
  productId: string;
}

interface Country {
  id: string;
  code: string;
  name: string;
  currency_code: string;
  flag_emoji: string;
}

interface Listing {
  id?: string;
  country_id: string;
  price: number;
  currency_code: string;
  stock_qty: number;
  is_available: boolean;
  fulfillment_type: "seller" | "feyxa";
}

export function ProductListingsEditor({ productId }: Props) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [listings, setListings] = useState<Record<string, Listing>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [productId]);

  const loadData = async () => {
    setLoading(true);
    const [{ data: countriesData }, { data: listingsData }] = await Promise.all([
      supabase.from("countries").select("id, code, name, currency_code, flag_emoji").eq("is_active", true).order("sort_order"),
      supabase.from("product_listings").select("*").eq("product_id", productId),
    ]);

    setCountries((countriesData || []) as Country[]);

    const map: Record<string, Listing> = {};
    for (const l of (listingsData || []) as any[]) {
      map[l.country_id] = {
        id: l.id,
        country_id: l.country_id,
        price: l.price,
        currency_code: l.currency_code,
        stock_qty: l.stock_qty,
        is_available: l.is_available,
        fulfillment_type: l.fulfillment_type || "seller",
      };
    }
    setListings(map);
    setLoading(false);
  };

  const toggleCountry = (country: Country) => {
    setListings((prev) => {
      const copy = { ...prev };
      if (copy[country.id]) {
        copy[country.id] = { ...copy[country.id], is_available: !copy[country.id].is_available };
      } else {
        copy[country.id] = {
          country_id: country.id,
          price: 0,
          currency_code: country.currency_code,
          stock_qty: 0,
          is_available: true,
          fulfillment_type: "seller",
        };
      }
      return copy;
    });
  };

  const updateField = (countryId: string, field: string, value: any) => {
    setListings((prev) => ({
      ...prev,
      [countryId]: { ...prev[countryId], [field]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const upserts = Object.values(listings).map((l) => ({
      product_id: productId,
      country_id: l.country_id,
      price: Number(l.price),
      currency_code: l.currency_code,
      stock_qty: Number(l.stock_qty),
      is_available: l.is_available,
      fulfillment_type: l.fulfillment_type,
    }));

    if (upserts.length > 0) {
      const { error } = await supabase
        .from("product_listings")
        .upsert(upserts, { onConflict: "product_id,country_id" });

      if (error) {
        toast.error("Erreur de sauvegarde");
      } else {
        toast.success("Disponibilité mise à jour");
      }
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={18} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe size={16} className="text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Disponibilité par pays</h3>
        </div>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Save size={14} className="mr-1.5" />}
          Sauvegarder
        </Button>
      </div>

      <div className="space-y-2">
        {countries.map((c) => {
          const listing = listings[c.id];
          const isActive = listing?.is_available ?? false;

          return (
            <div
              key={c.id}
              className="rounded-lg border border-border p-3 transition-colors"
              style={{ opacity: isActive ? 1 : 0.5 }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">{c.flag_emoji}</span>
                  <span className="text-sm font-medium text-foreground">{c.name}</span>
                  <span className="text-xs text-muted-foreground">{c.currency_code}</span>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={() => toggleCountry(c)}
                />
              </div>

              {isActive && listing && (
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Prix ({listing.currency_code})</label>
                    <Input
                      type="number"
                      min={0}
                      value={listing.price}
                      onChange={(e) => updateField(c.id, "price", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Stock</label>
                    <Input
                      type="number"
                      min={0}
                      value={listing.stock_qty}
                      onChange={(e) => updateField(c.id, "stock_qty", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 block">Expédition</label>
                    <select
                      className="w-full h-8 text-sm rounded-md border border-border bg-background px-2"
                      value={listing.fulfillment_type}
                      onChange={(e) => updateField(c.id, "fulfillment_type", e.target.value)}
                    >
                      <option value="seller">Expédié par le vendeur</option>
                      <option value="feyxa">⚡ Expédié par Feyxa</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
