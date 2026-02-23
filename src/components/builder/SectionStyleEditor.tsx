import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { LandingSection } from "@/lib/landing-templates";
import { ChevronDown, ChevronRight } from "lucide-react";

interface SectionStyleEditorProps {
  section: LandingSection;
  onChange: (style: Record<string, any>) => void;
}

function CollapsibleGroup({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hover:bg-muted/50 transition-colors"
      >
        {title}
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>
      {open && <div className="px-3 pb-3 space-y-3">{children}</div>}
    </div>
  );
}

function ColorField({ label, value, onChange, onClear }: { label: string; value: string; onChange: (v: string) => void; onClear?: () => void }) {
  return (
    <div>
      <Label className="text-[10px]">{label}</Label>
      <div className="flex items-center gap-2 mt-1">
        <input type="color" value={value || "#000000"} onChange={(e) => onChange(e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0 shrink-0" />
        <Input value={value || ""} onChange={(e) => onChange(e.target.value)} className="h-7 text-[10px] flex-1" placeholder="Hériter du thème" />
        {value && onClear && (
          <button onClick={onClear} className="text-[9px] text-muted-foreground hover:text-destructive shrink-0">✕</button>
        )}
      </div>
    </div>
  );
}

function SliderField({ label, value, onChange, min, max, step, unit = "px" }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; unit?: string }) {
  return (
    <div>
      <Label className="text-[10px]">{label}</Label>
      <div className="flex items-center gap-2 mt-1">
        <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={min} max={max} step={step} className="flex-1" />
        <span className="text-[10px] text-muted-foreground w-12 text-right">{value}{unit}</span>
      </div>
    </div>
  );
}

const ANIMATION_PRESETS = [
  { value: "none", label: "Aucune" },
  { value: "fadeIn", label: "Fondu" },
  { value: "fadeInUp", label: "Fondu + Montée" },
  { value: "fadeInDown", label: "Fondu + Descente" },
  { value: "fadeInLeft", label: "Fondu + Gauche" },
  { value: "fadeInRight", label: "Fondu + Droite" },
  { value: "zoomIn", label: "Zoom In" },
  { value: "zoomOut", label: "Zoom Out" },
  { value: "slideUp", label: "Glisser Haut" },
  { value: "slideDown", label: "Glisser Bas" },
  { value: "bounceIn", label: "Rebond" },
  { value: "flipIn", label: "Flip" },
  { value: "rotateIn", label: "Rotation" },
];

const BLEND_MODES = [
  "normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light",
];

export function SectionStyleEditor({ section, onChange }: SectionStyleEditorProps) {
  const style = section.data?._style || {};
  const set = (key: string, value: any) => onChange({ ...style, [key]: value });
  const clear = (key: string) => {
    const next = { ...style };
    delete next[key];
    onChange(next);
  };

  return (
    <div className="space-y-2 text-xs">
      {/* Background */}
      <CollapsibleGroup title="Arrière-plan" defaultOpen>
        <ColorField label="Couleur" value={style.backgroundColor || ""} onChange={(v) => set("backgroundColor", v)} onClear={() => clear("backgroundColor")} />

        <div>
          <Label className="text-[10px]">Image de fond</Label>
          <Input value={style.backgroundImage || ""} onChange={(e) => set("backgroundImage", e.target.value)} className="h-7 text-[10px] mt-1" placeholder="URL de l'image..." />
          {style.backgroundImage && (
            <div className="mt-2 space-y-2">
              <Select value={style.backgroundSize || "cover"} onValueChange={(v) => set("backgroundSize", v)}>
                <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cover">Couvrir</SelectItem>
                  <SelectItem value="contain">Contenir</SelectItem>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="100% 100%">Étirer</SelectItem>
                </SelectContent>
              </Select>
              <Select value={style.backgroundPosition || "center"} onValueChange={(v) => set("backgroundPosition", v)}>
                <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="center">Centre</SelectItem>
                  <SelectItem value="top">Haut</SelectItem>
                  <SelectItem value="bottom">Bas</SelectItem>
                  <SelectItem value="left">Gauche</SelectItem>
                  <SelectItem value="right">Droite</SelectItem>
                </SelectContent>
              </Select>
              <Select value={style.backgroundRepeat || "no-repeat"} onValueChange={(v) => set("backgroundRepeat", v)}>
                <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-repeat">Pas de répétition</SelectItem>
                  <SelectItem value="repeat">Répéter</SelectItem>
                  <SelectItem value="repeat-x">Répéter X</SelectItem>
                  <SelectItem value="repeat-y">Répéter Y</SelectItem>
                </SelectContent>
              </Select>
              <label className="flex items-center gap-2 text-[10px]">
                <input type="checkbox" checked={style.backgroundFixed || false} onChange={(e) => set("backgroundFixed", e.target.checked)} />
                Parallaxe (fixed)
              </label>
            </div>
          )}
        </div>

        {/* Gradient */}
        <div>
          <label className="flex items-center gap-2 text-[10px] mb-1">
            <input type="checkbox" checked={!!style.gradient} onChange={(e) => set("gradient", e.target.checked ? { type: "linear", angle: 135, from: "#667eea", to: "#764ba2" } : null)} />
            Dégradé
          </label>
          {style.gradient && (
            <div className="space-y-2 pl-2 border-l-2 border-primary/20">
              <Select value={style.gradient.type || "linear"} onValueChange={(v) => set("gradient", { ...style.gradient, type: v })}>
                <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linéaire</SelectItem>
                  <SelectItem value="radial">Radial</SelectItem>
                  <SelectItem value="conic">Conique</SelectItem>
                </SelectContent>
              </Select>
              {style.gradient.type === "linear" && (
                <SliderField label="Angle" value={style.gradient.angle ?? 135} onChange={(v) => set("gradient", { ...style.gradient, angle: v })} min={0} max={360} step={5} unit="°" />
              )}
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-[9px]">Début</Label>
                  <div className="flex gap-1 mt-0.5">
                    <input type="color" value={style.gradient.from || "#667eea"} onChange={(e) => set("gradient", { ...style.gradient, from: e.target.value })} className="w-6 h-6 rounded border-0 cursor-pointer" />
                    <Input value={style.gradient.from || ""} onChange={(e) => set("gradient", { ...style.gradient, from: e.target.value })} className="h-6 text-[9px]" />
                  </div>
                </div>
                <div className="flex-1">
                  <Label className="text-[9px]">Fin</Label>
                  <div className="flex gap-1 mt-0.5">
                    <input type="color" value={style.gradient.to || "#764ba2"} onChange={(e) => set("gradient", { ...style.gradient, to: e.target.value })} className="w-6 h-6 rounded border-0 cursor-pointer" />
                    <Input value={style.gradient.to || ""} onChange={(e) => set("gradient", { ...style.gradient, to: e.target.value })} className="h-6 text-[9px]" />
                  </div>
                </div>
              </div>
              {/* Third color stop */}
              <label className="flex items-center gap-2 text-[9px]">
                <input type="checkbox" checked={!!style.gradient.via} onChange={(e) => set("gradient", { ...style.gradient, via: e.target.checked ? "#a855f7" : null })} />
                3ème couleur
              </label>
              {style.gradient.via && (
                <div className="flex gap-1">
                  <input type="color" value={style.gradient.via} onChange={(e) => set("gradient", { ...style.gradient, via: e.target.value })} className="w-6 h-6 rounded border-0 cursor-pointer" />
                  <Input value={style.gradient.via} onChange={(e) => set("gradient", { ...style.gradient, via: e.target.value })} className="h-6 text-[9px]" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Overlay */}
        <div>
          <label className="flex items-center gap-2 text-[10px] mb-1">
            <input type="checkbox" checked={!!style.overlay} onChange={(e) => set("overlay", e.target.checked ? { color: "#000000", opacity: 40 } : null)} />
            Overlay (voile)
          </label>
          {style.overlay && (
            <div className="space-y-2 pl-2 border-l-2 border-primary/20">
              <div className="flex gap-1 items-center">
                <input type="color" value={style.overlay.color || "#000000"} onChange={(e) => set("overlay", { ...style.overlay, color: e.target.value })} className="w-6 h-6 rounded border-0 cursor-pointer" />
                <Input value={style.overlay.color || ""} onChange={(e) => set("overlay", { ...style.overlay, color: e.target.value })} className="h-6 text-[9px] flex-1" />
              </div>
              <SliderField label="Opacité overlay" value={style.overlay.opacity ?? 40} onChange={(v) => set("overlay", { ...style.overlay, opacity: v })} min={0} max={100} step={5} unit="%" />
            </div>
          )}
        </div>

        {/* Blend mode */}
        {style.backgroundImage && (
          <Select value={style.blendMode || "normal"} onValueChange={(v) => set("blendMode", v)}>
            <SelectTrigger className="h-7 text-[10px]"><SelectValue placeholder="Blend mode" /></SelectTrigger>
            <SelectContent>
              {BLEND_MODES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </CollapsibleGroup>

      {/* Spacing */}
      <CollapsibleGroup title="Espacement" defaultOpen>
        <SliderField label="Padding haut" value={style.paddingTop ?? style.paddingY ?? 80} onChange={(v) => set("paddingTop", v)} min={0} max={200} step={4} />
        <SliderField label="Padding bas" value={style.paddingBottom ?? style.paddingY ?? 80} onChange={(v) => set("paddingBottom", v)} min={0} max={200} step={4} />
        <SliderField label="Padding gauche" value={style.paddingLeft ?? style.paddingX ?? 24} onChange={(v) => set("paddingLeft", v)} min={0} max={120} step={4} />
        <SliderField label="Padding droit" value={style.paddingRight ?? style.paddingX ?? 24} onChange={(v) => set("paddingRight", v)} min={0} max={120} step={4} />
        <div className="h-px bg-border" />
        <SliderField label="Marge haut" value={style.marginTop ?? 0} onChange={(v) => set("marginTop", v)} min={-100} max={200} step={4} />
        <SliderField label="Marge bas" value={style.marginBottom ?? 0} onChange={(v) => set("marginBottom", v)} min={-100} max={200} step={4} />
      </CollapsibleGroup>

      {/* Dimensions */}
      <CollapsibleGroup title="Dimensions">
        <div>
          <Label className="text-[10px]">Largeur maximale</Label>
          <Select value={style.maxWidth || "default"} onValueChange={(v) => set("maxWidth", v === "default" ? "" : v)}>
            <SelectTrigger className="h-7 text-[10px] mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Par défaut</SelectItem>
              <SelectItem value="640px">Étroit (640px)</SelectItem>
              <SelectItem value="768px">Moyen (768px)</SelectItem>
              <SelectItem value="980px">Standard (980px)</SelectItem>
              <SelectItem value="1200px">Large (1200px)</SelectItem>
              <SelectItem value="1440px">Extra-large (1440px)</SelectItem>
              <SelectItem value="100%">Pleine largeur</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px]">Hauteur minimum</Label>
          <Select value={style.minHeight || "auto"} onValueChange={(v) => set("minHeight", v)}>
            <SelectTrigger className="h-7 text-[10px] mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto</SelectItem>
              <SelectItem value="300px">300px</SelectItem>
              <SelectItem value="400px">400px</SelectItem>
              <SelectItem value="500px">500px</SelectItem>
              <SelectItem value="600px">600px</SelectItem>
              <SelectItem value="100vh">Plein écran</SelectItem>
              <SelectItem value="50vh">Demi écran</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px]">Alignement vertical</Label>
          <Select value={style.verticalAlign || "start"} onValueChange={(v) => set("verticalAlign", v)}>
            <SelectTrigger className="h-7 text-[10px] mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="start">Haut</SelectItem>
              <SelectItem value="center">Centre</SelectItem>
              <SelectItem value="end">Bas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CollapsibleGroup>

      {/* Typography */}
      <CollapsibleGroup title="Typographie">
        <ColorField label="Couleur texte" value={style.textColor || ""} onChange={(v) => set("textColor", v)} onClear={() => clear("textColor")} />
        <div>
          <Label className="text-[10px]">Alignement</Label>
          <div className="flex gap-1 mt-1">
            {(["left", "center", "right", "justify"] as const).map(a => (
              <button
                key={a}
                onClick={() => set("textAlign", a)}
                className={`flex-1 py-1.5 text-[10px] rounded border transition-colors ${style.textAlign === a ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
              >
                {a === "left" ? "⬅" : a === "center" ? "⬌" : a === "right" ? "➡" : "☰"}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label className="text-[10px]">Police personnalisée</Label>
          <Input value={style.fontFamily || ""} onChange={(e) => set("fontFamily", e.target.value)} className="h-7 text-[10px] mt-1" placeholder="Hériter du thème" />
        </div>
        <SliderField label="Taille titre" value={style.titleSize ?? 0} onChange={(v) => set("titleSize", v)} min={0} max={120} step={2} />
        <SliderField label="Espacement lettres" value={style.letterSpacing ?? 0} onChange={(v) => set("letterSpacing", v)} min={-5} max={20} step={0.5} unit="px" />
      </CollapsibleGroup>

      {/* Borders */}
      <CollapsibleGroup title="Bordures">
        <SliderField label="Coins arrondis" value={style.borderRadius ?? 0} onChange={(v) => set("borderRadius", v)} min={0} max={60} step={2} />
        <div>
          <Label className="text-[10px]">Style de bordure</Label>
          <Select value={style.borderStyle || "none"} onValueChange={(v) => set("borderStyle", v)}>
            <SelectTrigger className="h-7 text-[10px] mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucune</SelectItem>
              <SelectItem value="solid">Solide</SelectItem>
              <SelectItem value="dashed">Tirets</SelectItem>
              <SelectItem value="dotted">Points</SelectItem>
              <SelectItem value="double">Double</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {style.borderStyle && style.borderStyle !== "none" && (
          <>
            <SliderField label="Épaisseur" value={style.borderWidth ?? 1} onChange={(v) => set("borderWidth", v)} min={1} max={10} step={1} />
            <ColorField label="Couleur bordure" value={style.borderColor || ""} onChange={(v) => set("borderColor", v)} onClear={() => clear("borderColor")} />
          </>
        )}
      </CollapsibleGroup>

      {/* Shadows */}
      <CollapsibleGroup title="Ombres">
        <div>
          <Label className="text-[10px]">Type d'ombre</Label>
          <Select value={style.shadow || "none"} onValueChange={(v) => set("shadow", v)}>
            <SelectTrigger className="h-7 text-[10px] mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucune</SelectItem>
              <SelectItem value="sm">Légère</SelectItem>
              <SelectItem value="md">Moyenne</SelectItem>
              <SelectItem value="lg">Forte</SelectItem>
              <SelectItem value="xl">Très forte</SelectItem>
              <SelectItem value="2xl">Dramatique</SelectItem>
              <SelectItem value="inner">Intérieure</SelectItem>
              <SelectItem value="custom">Personnalisée</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {style.shadow === "custom" && (
          <div className="space-y-2 pl-2 border-l-2 border-primary/20">
            <SliderField label="X" value={style.shadowX ?? 0} onChange={(v) => set("shadowX", v)} min={-50} max={50} step={1} />
            <SliderField label="Y" value={style.shadowY ?? 4} onChange={(v) => set("shadowY", v)} min={-50} max={50} step={1} />
            <SliderField label="Flou" value={style.shadowBlur ?? 12} onChange={(v) => set("shadowBlur", v)} min={0} max={100} step={1} />
            <SliderField label="Étendue" value={style.shadowSpread ?? 0} onChange={(v) => set("shadowSpread", v)} min={-50} max={50} step={1} />
            <ColorField label="Couleur ombre" value={style.shadowColor || "rgba(0,0,0,0.15)"} onChange={(v) => set("shadowColor", v)} />
          </div>
        )}
      </CollapsibleGroup>

      {/* Effects */}
      <CollapsibleGroup title="Effets">
        <SliderField label="Opacité" value={style.opacity ?? 100} onChange={(v) => set("opacity", v)} min={0} max={100} step={5} unit="%" />
        <SliderField label="Flou (blur)" value={style.blur ?? 0} onChange={(v) => set("blur", v)} min={0} max={20} step={1} />
        <div>
          <Label className="text-[10px]">Filtre</Label>
          <Select value={style.filter || "none"} onValueChange={(v) => set("filter", v)}>
            <SelectTrigger className="h-7 text-[10px] mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucun</SelectItem>
              <SelectItem value="grayscale">Niveaux de gris</SelectItem>
              <SelectItem value="sepia">Sépia</SelectItem>
              <SelectItem value="saturate">Saturation+</SelectItem>
              <SelectItem value="brightness">Luminosité+</SelectItem>
              <SelectItem value="contrast">Contraste+</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <label className="flex items-center gap-2 text-[10px]">
          <input type="checkbox" checked={style.overflow === "hidden"} onChange={(e) => set("overflow", e.target.checked ? "hidden" : "")} />
          Masquer le débordement
        </label>
      </CollapsibleGroup>

      {/* Animation */}
      <CollapsibleGroup title="Animation">
        <div>
          <Label className="text-[10px]">Animation d'entrée</Label>
          <Select value={style.animation || "none"} onValueChange={(v) => set("animation", v)}>
            <SelectTrigger className="h-7 text-[10px] mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ANIMATION_PRESETS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {style.animation && style.animation !== "none" && (
          <>
            <SliderField label="Durée" value={style.animationDuration ?? 600} onChange={(v) => set("animationDuration", v)} min={100} max={2000} step={50} unit="ms" />
            <SliderField label="Délai" value={style.animationDelay ?? 0} onChange={(v) => set("animationDelay", v)} min={0} max={2000} step={50} unit="ms" />
            <div>
              <Label className="text-[10px]">Easing</Label>
              <Select value={style.animationEasing || "easeOut"} onValueChange={(v) => set("animationEasing", v)}>
                <SelectTrigger className="h-7 text-[10px] mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linéaire</SelectItem>
                  <SelectItem value="easeIn">Ease In</SelectItem>
                  <SelectItem value="easeOut">Ease Out</SelectItem>
                  <SelectItem value="easeInOut">Ease In-Out</SelectItem>
                  <SelectItem value="spring">Spring</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </CollapsibleGroup>

      {/* Hover Effects */}
      <CollapsibleGroup title="Effets au survol">
        <div>
          <Label className="text-[10px]">Effet hover</Label>
          <Select value={style.hoverEffect || "none"} onValueChange={(v) => set("hoverEffect", v)}>
            <SelectTrigger className="h-7 text-[10px] mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucun</SelectItem>
              <SelectItem value="lift">Élévation</SelectItem>
              <SelectItem value="glow">Lueur</SelectItem>
              <SelectItem value="scale">Agrandir</SelectItem>
              <SelectItem value="darken">Assombrir</SelectItem>
              <SelectItem value="brighten">Éclaircir</SelectItem>
              <SelectItem value="border-glow">Bordure lumineuse</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <SliderField label="Transition" value={style.hoverTransition ?? 300} onChange={(v) => set("hoverTransition", v)} min={100} max={1000} step={50} unit="ms" />
      </CollapsibleGroup>

      {/* Custom CSS */}
      <CollapsibleGroup title="Avancé">
        <div>
          <Label className="text-[10px]">Classe CSS personnalisée</Label>
          <Input value={style.customClass || ""} onChange={(e) => set("customClass", e.target.value)} className="h-7 text-[10px] mt-1" placeholder="ex: my-section" />
        </div>
        <div>
          <Label className="text-[10px]">ID HTML</Label>
          <Input value={style.htmlId || ""} onChange={(e) => set("htmlId", e.target.value)} className="h-7 text-[10px] mt-1" placeholder="ex: about-section" />
        </div>
        <div>
          <Label className="text-[10px]">Z-Index</Label>
          <Input type="number" value={style.zIndex ?? ""} onChange={(e) => set("zIndex", e.target.value ? Number(e.target.value) : "")} className="h-7 text-[10px] mt-1" placeholder="Auto" />
        </div>
        <div>
          <Label className="text-[10px]">Position</Label>
          <Select value={style.position || "relative"} onValueChange={(v) => set("position", v)}>
            <SelectTrigger className="h-7 text-[10px] mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="relative">Relative</SelectItem>
              <SelectItem value="sticky">Sticky</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <label className="flex items-center gap-2 text-[10px]">
          <input type="checkbox" checked={style.hideOnMobile || false} onChange={(e) => set("hideOnMobile", e.target.checked)} />
          Masquer sur mobile
        </label>
        <label className="flex items-center gap-2 text-[10px]">
          <input type="checkbox" checked={style.hideOnDesktop || false} onChange={(e) => set("hideOnDesktop", e.target.checked)} />
          Masquer sur desktop
        </label>
      </CollapsibleGroup>
    </div>
  );
}
