import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Check, Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import {
  LANDING_THEME_PRESETS,
  LandingThemePreset,
  getCustomPresets,
  saveCustomPreset,
  deleteCustomPreset,
} from "@/lib/landing-theme-presets";

interface LandingTheme {
  primaryColor: string;
  bgColor: string;
  textColor: string;
  radius: string;
  fontHeading: string;
  fontBody: string;
}

interface Props {
  currentTheme: LandingTheme;
  onApply: (theme: LandingTheme) => void;
}

export function LandingThemePresets({ currentTheme, onApply }: Props) {
  const [customPresets, setCustomPresets] = useState<LandingThemePreset[]>(getCustomPresets);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");

  const allPresets = [...LANDING_THEME_PRESETS, ...customPresets];

  const isCurrentTheme = (preset: LandingThemePreset) =>
    preset.theme.primaryColor === currentTheme.primaryColor &&
    preset.theme.bgColor === currentTheme.bgColor &&
    preset.theme.textColor === currentTheme.textColor;

  const handleApply = (preset: LandingThemePreset) => {
    onApply(preset.theme);
    toast.success(`Thème "${preset.name}" appliqué`);
  };

  const handleSaveCustom = () => {
    if (!newPresetName.trim()) {
      toast.error("Entrez un nom pour le preset");
      return;
    }
    const preset: LandingThemePreset = {
      id: `custom-${Date.now()}`,
      name: newPresetName.trim(),
      description: "Preset personnalisé",
      icon: "🎨",
      theme: { ...currentTheme },
      isCustom: true,
    };
    saveCustomPreset(preset);
    setCustomPresets(getCustomPresets());
    setShowSaveDialog(false);
    setNewPresetName("");
    toast.success("Preset sauvegardé !");
  };

  const handleDeleteCustom = (id: string) => {
    deleteCustomPreset(id);
    setCustomPresets(getCustomPresets());
    toast.success("Preset supprimé");
  };

  return (
    <div className="space-y-3">
      {/* Save current as preset */}
      <Button
        size="sm"
        variant="outline"
        className="w-full gap-1.5 text-xs"
        onClick={() => setShowSaveDialog(true)}
      >
        <Save className="w-3.5 h-3.5" /> Sauvegarder le style actuel
      </Button>

      {/* Predefined presets */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Thèmes prédéfinis
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {LANDING_THEME_PRESETS.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              isActive={isCurrentTheme(preset)}
              onApply={() => handleApply(preset)}
            />
          ))}
        </div>
      </div>

      {/* Custom presets */}
      {customPresets.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Mes presets
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {customPresets.map((preset) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                isActive={isCurrentTheme(preset)}
                onApply={() => handleApply(preset)}
                onDelete={() => handleDeleteCustom(preset.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Save dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Sauvegarder comme preset</DialogTitle>
            <DialogDescription className="text-xs">
              Le style actuel sera sauvegardé et réutilisable sur toutes vos landing pages.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2">
              {[currentTheme.primaryColor, currentTheme.bgColor, currentTheme.textColor].map((c, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-lg border border-border shadow-sm"
                  style={{ backgroundColor: c }}
                />
              ))}
              <div className="text-xs text-muted-foreground flex-1">
                {currentTheme.fontHeading} / {currentTheme.fontBody}
              </div>
            </div>
            <Input
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              placeholder="Nom du preset (ex: Mon style luxe)"
              className="h-8 text-xs"
              maxLength={40}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSaveCustom()}
            />
          </div>
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setShowSaveDialog(false)}>
              Annuler
            </Button>
            <Button size="sm" onClick={handleSaveCustom} disabled={!newPresetName.trim()}>
              <Save className="w-3.5 h-3.5 mr-1" /> Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PresetCard({
  preset,
  isActive,
  onApply,
  onDelete,
}: {
  preset: LandingThemePreset;
  isActive: boolean;
  onApply: () => void;
  onDelete?: () => void;
}) {
  return (
    <button
      onClick={onApply}
      className={`group relative text-left p-2 rounded-lg border transition-all text-[11px] ${
        isActive
          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
          : "border-border hover:border-primary/30 hover:bg-muted/50"
      }`}
    >
      {/* Color preview dots */}
      <div className="flex gap-1 mb-1.5">
        <div
          className="w-4 h-4 rounded-full border border-border/50"
          style={{ backgroundColor: preset.theme.primaryColor }}
        />
        <div
          className="w-4 h-4 rounded-full border border-border/50"
          style={{ backgroundColor: preset.theme.bgColor }}
        />
        <div
          className="w-4 h-4 rounded-full border border-border/50"
          style={{ backgroundColor: preset.theme.textColor }}
        />
        {isActive && (
          <Check className="w-3.5 h-3.5 text-primary ml-auto" />
        )}
      </div>
      <p className="font-medium text-foreground leading-tight">
        {preset.icon} {preset.name}
      </p>
      <p className="text-muted-foreground text-[9px] leading-tight mt-0.5">
        {preset.description}
      </p>
      {/* Delete button for custom presets */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-1 right-1 p-1 rounded opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 transition-all"
          title="Supprimer"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </button>
  );
}
