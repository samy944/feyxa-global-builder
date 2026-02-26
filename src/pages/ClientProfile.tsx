import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  Globe,
  MapPin,
  Phone,
  Pencil,
  Trash2,
  Plus,
  Star,
  User,
} from "lucide-react";
import { useTranslation, type Language } from "@/lib/i18n";

interface SavedAddress {
  id: string;
  label: string;
  full_name: string | null;
  phone: string | null;
  city_name: string | null;
  quarter: string | null;
  address: string | null;
  is_default: boolean;
}

interface AddressForm {
  label: string;
  full_name: string;
  phone: string;
  city_name: string;
  quarter: string;
  address: string;
  is_default: boolean;
}

const emptyForm: AddressForm = {
  label: "",
  full_name: "",
  phone: "",
  city_name: "",
  quarter: "",
  address: "",
  is_default: false,
};

export default function ClientProfile() {
  const { user } = useAuth();
  const { t, lang, setLang } = useTranslation();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Address book state
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<AddressForm>(emptyForm);
  const [addressSaving, setAddressSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchAddresses();
    }
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("full_name, phone, preferred_language")
      .eq("id", user!.id)
      .maybeSingle();
    if (data) {
      setFullName(data.full_name || "");
      setPhone(data.phone || "");
    }
    setLoading(false);
  };

  const fetchAddresses = async () => {
    setAddressesLoading(true);
    const { data } = await supabase
      .from("saved_addresses")
      .select("id, label, full_name, phone, city_name, quarter, address, is_default")
      .eq("user_id", user!.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    setAddresses((data || []) as SavedAddress[]);
    setAddressesLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone })
      .eq("id", user!.id);
    setSaving(false);
    if (error) {
      toast.error(t.errors.generic);
    } else {
      toast.success(t.common.success);
    }
  };

  // ── Address CRUD ──
  const openAddDialog = () => {
    setEditingId(null);
    setAddressForm({ ...emptyForm, full_name: fullName, phone });
    setDialogOpen(true);
  };

  const openEditDialog = (addr: SavedAddress) => {
    setEditingId(addr.id);
    setAddressForm({
      label: addr.label,
      full_name: addr.full_name || "",
      phone: addr.phone || "",
      city_name: addr.city_name || "",
      quarter: addr.quarter || "",
      address: addr.address || "",
      is_default: addr.is_default,
    });
    setDialogOpen(true);
  };

  const handleAddressSave = async () => {
    if (!addressForm.full_name.trim() || !addressForm.phone.trim() || !addressForm.city_name.trim()) {
      toast.error("Veuillez remplir les champs obligatoires (Nom, Téléphone, Ville).");
      return;
    }
    setAddressSaving(true);

    // If marking as default, unset others first
    if (addressForm.is_default) {
      await supabase
        .from("saved_addresses")
        .update({ is_default: false } as any)
        .eq("user_id", user!.id);
    }

    const payload = {
      user_id: user!.id,
      label: addressForm.label || `${addressForm.city_name} - ${addressForm.quarter || "principale"}`,
      full_name: addressForm.full_name,
      phone: addressForm.phone,
      city_name: addressForm.city_name,
      quarter: addressForm.quarter || null,
      address: addressForm.address || null,
      is_default: addressForm.is_default || addresses.length === 0,
    };

    if (editingId) {
      await supabase.from("saved_addresses").update(payload as any).eq("id", editingId);
    } else {
      await supabase.from("saved_addresses").insert(payload as any);
    }

    setAddressSaving(false);
    setDialogOpen(false);
    fetchAddresses();
    toast.success(editingId ? "Adresse mise à jour" : "Adresse ajoutée");
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await supabase.from("saved_addresses").delete().eq("id", id);
    setDeletingId(null);
    fetchAddresses();
    toast.success("Adresse supprimée");
  };

  const handleSetDefault = async (id: string) => {
    await supabase
      .from("saved_addresses")
      .update({ is_default: false } as any)
      .eq("user_id", user!.id);
    await supabase
      .from("saved_addresses")
      .update({ is_default: true } as any)
      .eq("id", id);
    fetchAddresses();
    toast.success("Adresse par défaut mise à jour");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <h1 className="font-heading text-2xl text-foreground mb-6">{t.account.myProfile}</h1>

      <form onSubmit={handleSave} className="space-y-5 max-w-lg">
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">{t.auth.email}</label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full h-10 rounded-lg border border-border bg-muted px-3 text-sm text-muted-foreground"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">{t.auth.fullName}</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Jean Kouassi"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">{t.checkout.phone}</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="+225 07 00 00 00"
            />
          </div>
        </div>

        {/* Language Preference */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Globe size={18} className="text-muted-foreground" />
            <label className="text-sm font-medium text-foreground">{t.account.languagePref}</label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setLang("fr")}
              className={`flex items-center justify-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-all ${
                lang === "fr"
                  ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                  : "border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              🇫🇷 {t.common.french}
            </button>
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`flex items-center justify-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-all ${
                lang === "en"
                  ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                  : "border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              🇬🇧 {t.common.english}
            </button>
          </div>
        </div>

        <Button type="submit" variant="hero" disabled={saving}>
          {saving ? <Loader2 size={16} className="mr-1 animate-spin" /> : <Save size={16} className="mr-1" />}
          {t.common.save}
        </Button>
      </form>

      {/* ── Address Book ── */}
      <div className="mt-10 max-w-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading text-xl text-foreground flex items-center gap-2">
            <MapPin size={20} className="text-primary" />
            Mes adresses de livraison
          </h2>
          <Button variant="outline" size="sm" onClick={openAddDialog}>
            <Plus size={14} />
            Ajouter une adresse
          </Button>
        </div>

        {addressesLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={20} className="animate-spin text-primary" />
          </div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-border rounded-xl">
            <MapPin size={32} className="mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground mb-3">Aucune adresse enregistrée</p>
            <Button variant="outline" size="sm" onClick={openAddDialog}>
              <Plus size={14} />
              Ajouter ma première adresse
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <Card
                key={addr.id}
                className={`relative transition-all ${
                  addr.is_default ? "border-primary/50 bg-primary/5" : ""
                }`}
              >
                <CardContent className="p-4 space-y-2">
                  {addr.is_default && (
                    <Badge variant="default" className="text-[10px] mb-1">
                      <Star size={10} className="mr-0.5" />
                      Adresse par défaut
                    </Badge>
                  )}
                  <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <User size={13} className="text-muted-foreground" />
                    {addr.full_name || addr.label}
                  </p>
                  {addr.phone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Phone size={11} />
                      {addr.phone}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <MapPin size={11} className="mt-0.5 shrink-0" />
                    <span>
                      {[addr.city_name, addr.quarter, addr.address].filter(Boolean).join(", ")}
                    </span>
                  </p>

                  <div className="flex items-center gap-1 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => openEditDialog(addr)}
                    >
                      <Pencil size={12} />
                      Modifier
                    </Button>
                    {!addr.is_default && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleSetDefault(addr.id)}
                      >
                        <Star size={12} />
                        Par défaut
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                      onClick={() => handleDelete(addr.id)}
                      disabled={deletingId === addr.id}
                    >
                      {deletingId === addr.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Trash2 size={12} />
                      )}
                      Supprimer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── Address Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifier l'adresse" : "Nouvelle adresse"}</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Modifiez les informations de cette adresse de livraison."
                : "Ajoutez une nouvelle adresse de livraison à votre carnet."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nom complet *</Label>
              <Input
                value={addressForm.full_name}
                onChange={(e) => setAddressForm((p) => ({ ...p, full_name: e.target.value }))}
                placeholder="Jean Kouassi"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Téléphone *</Label>
              <Input
                type="tel"
                value={addressForm.phone}
                onChange={(e) => setAddressForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+225 07 00 00 00"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ville *</Label>
              <Input
                value={addressForm.city_name}
                onChange={(e) => setAddressForm((p) => ({ ...p, city_name: e.target.value }))}
                placeholder="Cotonou"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Quartier</Label>
                <Input
                  value={addressForm.quarter}
                  onChange={(e) => setAddressForm((p) => ({ ...p, quarter: e.target.value }))}
                  placeholder="Ganhi"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Adresse / Repère</Label>
                <Input
                  value={addressForm.address}
                  onChange={(e) => setAddressForm((p) => ({ ...p, address: e.target.value }))}
                  placeholder="Près du marché…"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Libellé</Label>
              <Input
                value={addressForm.label}
                onChange={(e) => setAddressForm((p) => ({ ...p, label: e.target.value }))}
                placeholder="Maison, Bureau…"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={addressForm.is_default}
                onChange={(e) => setAddressForm((p) => ({ ...p, is_default: e.target.checked }))}
                className="rounded border-border"
              />
              Définir comme adresse par défaut
            </label>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddressSave} disabled={addressSaving}>
              {addressSaving && <Loader2 size={14} className="animate-spin mr-1" />}
              {editingId ? "Mettre à jour" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
