import { GridWidget, WIDGET_CATALOGUE } from "./GridBuilderTypes";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { X } from "lucide-react";

interface Props {
  widget: GridWidget;
  onChange: (data: Record<string, any>) => void;
  onClose: () => void;
}

export function GridWidgetEditor({ widget, onChange, onClose }: Props) {
  const def = WIDGET_CATALOGUE.find(w => w.type === widget.type);
  const { type, data } = widget;

  const update = (key: string, value: any) => onChange({ ...data, [key]: value });

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{def?.icon}</span>
          <h3 className="font-semibold text-sm text-foreground">{def?.label || type}</h3>
        </div>
        <button onClick={onClose} className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted">
          <X size={14} />
        </button>
      </div>

      {(type === "heading" || type === "text") && (
        <>
          {type === "heading" ? (
            <div className="space-y-2">
              <Label className="text-xs">Texte</Label>
              <Input value={data.text} onChange={e => update("text", e.target.value)} />
              <Label className="text-xs">Niveau</Label>
              <Select value={data.level || "h2"} onValueChange={v => update("level", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["h1", "h2", "h3", "h4", "h5"].map(l => <SelectItem key={l} value={l}>{l.toUpperCase()}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-xs">Contenu</Label>
              <Textarea value={data.text} onChange={e => update("text", e.target.value)} rows={4} />
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-xs">Alignement</Label>
            <div className="flex gap-1">
              {(["left", "center", "right"] as const).map(a => (
                <button key={a} onClick={() => update("align", a)} className={`flex-1 text-xs py-1.5 rounded border transition-colors ${data.align === a ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
                  {a === "left" ? "⬅" : a === "center" ? "⬛" : "➡"}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {type === "image" && (
        <div className="space-y-2">
          <Label className="text-xs">URL de l'image</Label>
          <Input value={data.src} onChange={e => update("src", e.target.value)} />
          <Label className="text-xs">Texte alternatif</Label>
          <Input value={data.alt} onChange={e => update("alt", e.target.value)} />
        </div>
      )}

      {type === "button" && (
        <div className="space-y-2">
          <Label className="text-xs">Texte</Label>
          <Input value={data.text} onChange={e => update("text", e.target.value)} />
          <Label className="text-xs">Lien (URL)</Label>
          <Input value={data.url} onChange={e => update("url", e.target.value)} />
          <Label className="text-xs">Style</Label>
          <Select value={data.variant || "primary"} onValueChange={v => update("variant", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="primary">Primaire</SelectItem>
              <SelectItem value="outline">Contour</SelectItem>
              <SelectItem value="ghost">Fantôme</SelectItem>
            </SelectContent>
          </Select>
          <Label className="text-xs">Taille</Label>
          <Select value={data.size || "md"} onValueChange={v => update("size", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sm">Petit</SelectItem>
              <SelectItem value="md">Moyen</SelectItem>
              <SelectItem value="lg">Grand</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {type === "spacer" && (
        <div className="space-y-2">
          <Label className="text-xs">Hauteur ({data.height}px)</Label>
          <Slider value={[data.height]} onValueChange={([v]) => update("height", v)} min={8} max={200} step={4} />
        </div>
      )}

      {type === "divider" && (
        <div className="space-y-2">
          <Label className="text-xs">Style</Label>
          <Select value={data.style || "solid"} onValueChange={v => update("style", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="solid">Plein</SelectItem>
              <SelectItem value="dashed">Tirets</SelectItem>
              <SelectItem value="dotted">Pointillés</SelectItem>
            </SelectContent>
          </Select>
          <Label className="text-xs">Épaisseur ({data.thickness}px)</Label>
          <Slider value={[data.thickness || 1]} onValueChange={([v]) => update("thickness", v)} min={1} max={8} step={1} />
        </div>
      )}

      {type === "video" && (
        <div className="space-y-2">
          <Label className="text-xs">URL de la vidéo (YouTube/Vimeo embed)</Label>
          <Input value={data.url} onChange={e => update("url", e.target.value)} placeholder="https://www.youtube.com/embed/..." />
        </div>
      )}

      {type === "testimonial" && (
        <div className="space-y-2">
          <Label className="text-xs">Citation</Label>
          <Textarea value={data.quote} onChange={e => update("quote", e.target.value)} rows={3} />
          <Label className="text-xs">Auteur</Label>
          <Input value={data.author} onChange={e => update("author", e.target.value)} />
        </div>
      )}

      {type === "price" && (
        <div className="space-y-2">
          <Label className="text-xs">Montant</Label>
          <Input value={data.amount} onChange={e => update("amount", e.target.value)} />
          <Label className="text-xs">Devise</Label>
          <Input value={data.currency} onChange={e => update("currency", e.target.value)} />
          <Label className="text-xs">Ancien prix (barré)</Label>
          <Input value={data.oldPrice || ""} onChange={e => update("oldPrice", e.target.value)} />
        </div>
      )}

      {type === "countdown" && (
        <div className="space-y-2">
          <Label className="text-xs">Label</Label>
          <Input value={data.label} onChange={e => update("label", e.target.value)} />
          <Label className="text-xs">Date cible</Label>
          <Input type="datetime-local" value={data.targetDate || ""} onChange={e => update("targetDate", e.target.value)} />
        </div>
      )}

      {type === "badge" && (
        <div className="space-y-2">
          <Label className="text-xs">Texte</Label>
          <Input value={data.text} onChange={e => update("text", e.target.value)} />
          <Label className="text-xs">Couleur</Label>
          <Select value={data.color || "primary"} onValueChange={v => update("color", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="primary">Primaire</SelectItem>
              <SelectItem value="secondary">Secondaire</SelectItem>
              <SelectItem value="destructive">Rouge</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
