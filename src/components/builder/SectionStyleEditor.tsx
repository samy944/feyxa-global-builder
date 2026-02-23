import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { LandingSection } from "@/lib/landing-templates";

interface SectionStyleEditorProps {
  section: LandingSection;
  onChange: (style: Record<string, any>) => void;
}

export function SectionStyleEditor({ section, onChange }: SectionStyleEditorProps) {
  const style = section.data?._style || {};
  const set = (key: string, value: any) => onChange({ ...style, [key]: value });

  return (
    <div className="space-y-4 text-xs">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Style de la section</p>

      {/* Background */}
      <div>
        <Label className="text-[10px]">Arrière-plan</Label>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="color"
            value={style.backgroundColor || ""}
            onChange={(e) => set("backgroundColor", e.target.value)}
            className="w-7 h-7 rounded cursor-pointer border-0"
          />
          <Input
            value={style.backgroundColor || ""}
            onChange={(e) => set("backgroundColor", e.target.value)}
            className="h-7 text-[10px] flex-1"
            placeholder="Hériter du thème"
          />
          {style.backgroundColor && (
            <button onClick={() => set("backgroundColor", "")} className="text-[9px] text-muted-foreground hover:text-destructive">✕</button>
          )}
        </div>
      </div>

      {/* Background image */}
      <div>
        <Label className="text-[10px]">Image de fond</Label>
        <Input
          value={style.backgroundImage || ""}
          onChange={(e) => set("backgroundImage", e.target.value)}
          className="h-7 text-[10px] mt-1"
          placeholder="URL de l'image..."
        />
      </div>

      {/* Padding */}
      <div>
        <Label className="text-[10px]">Espacement vertical (padding)</Label>
        <div className="flex items-center gap-2 mt-1">
          <Slider
            value={[style.paddingY ?? 80]}
            onValueChange={([v]) => set("paddingY", v)}
            min={0}
            max={200}
            step={8}
            className="flex-1"
          />
          <span className="text-[10px] text-muted-foreground w-10 text-right">{style.paddingY ?? 80}px</span>
        </div>
      </div>

      <div>
        <Label className="text-[10px]">Espacement horizontal (padding)</Label>
        <div className="flex items-center gap-2 mt-1">
          <Slider
            value={[style.paddingX ?? 24]}
            onValueChange={([v]) => set("paddingX", v)}
            min={0}
            max={120}
            step={4}
            className="flex-1"
          />
          <span className="text-[10px] text-muted-foreground w-10 text-right">{style.paddingX ?? 24}px</span>
        </div>
      </div>

      {/* Max width */}
      <div>
        <Label className="text-[10px]">Largeur maximale</Label>
        <Select value={style.maxWidth || "default"} onValueChange={(v) => set("maxWidth", v === "default" ? "" : v)}>
          <SelectTrigger className="h-7 text-[10px] mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Par défaut</SelectItem>
            <SelectItem value="640px">Étroit (640px)</SelectItem>
            <SelectItem value="768px">Moyen (768px)</SelectItem>
            <SelectItem value="980px">Standard (980px)</SelectItem>
            <SelectItem value="1200px">Large (1200px)</SelectItem>
            <SelectItem value="100%">Pleine largeur</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Border radius */}
      <div>
        <Label className="text-[10px]">Coins arrondis</Label>
        <div className="flex items-center gap-2 mt-1">
          <Slider
            value={[style.borderRadius ?? 0]}
            onValueChange={([v]) => set("borderRadius", v)}
            min={0}
            max={32}
            step={2}
            className="flex-1"
          />
          <span className="text-[10px] text-muted-foreground w-10 text-right">{style.borderRadius ?? 0}px</span>
        </div>
      </div>

      {/* Text color override */}
      <div>
        <Label className="text-[10px]">Couleur texte (override)</Label>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="color"
            value={style.textColor || ""}
            onChange={(e) => set("textColor", e.target.value)}
            className="w-7 h-7 rounded cursor-pointer border-0"
          />
          <Input
            value={style.textColor || ""}
            onChange={(e) => set("textColor", e.target.value)}
            className="h-7 text-[10px] flex-1"
            placeholder="Hériter du thème"
          />
          {style.textColor && (
            <button onClick={() => set("textColor", "")} className="text-[9px] text-muted-foreground hover:text-destructive">✕</button>
          )}
        </div>
      </div>

      {/* Custom CSS class */}
      <div>
        <Label className="text-[10px]">Classe CSS personnalisée</Label>
        <Input
          value={style.customClass || ""}
          onChange={(e) => set("customClass", e.target.value)}
          className="h-7 text-[10px] mt-1"
          placeholder="ex: my-custom-section"
        />
      </div>
    </div>
  );
}
