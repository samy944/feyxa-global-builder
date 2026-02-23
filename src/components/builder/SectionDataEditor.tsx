import { LandingSection } from "@/lib/landing-templates";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/landing/ImageUploader";
import { Plus, Wand2 } from "lucide-react";

interface SectionDataEditorProps {
  section: LandingSection;
  onChange: (d: any) => void;
  onAiImage?: (field: string) => void;
}

function AiImageBtn({ field, onAiImage }: { field: string; onAiImage?: (field: string) => void }) {
  if (!onAiImage) return null;
  return (
    <button
      onClick={() => onAiImage(field)}
      className="text-[10px] text-violet-600 hover:text-violet-800 flex items-center gap-1 mt-1"
    >
      <Wand2 className="w-3 h-3" /> Générer avec l'IA
    </button>
  );
}

export function SectionDataEditor({ section, onChange, onAiImage }: SectionDataEditorProps) {
  const { data } = section;
  const set = (key: string, value: any) => onChange({ ...data, [key]: value });

  return (
    <div className="space-y-3 text-xs">
      {data.title !== undefined && (
        <div>
          <Label className="text-[10px]">Titre</Label>
          <Input value={data.title} onChange={e => set("title", e.target.value)} className="h-7 text-xs mt-0.5" />
        </div>
      )}
      {data.subtitle !== undefined && (
        <div>
          <Label className="text-[10px]">Sous-titre</Label>
          <Input value={data.subtitle} onChange={e => set("subtitle", e.target.value)} className="h-7 text-xs mt-0.5" />
        </div>
      )}
      {data.ctaText !== undefined && (
        <div>
          <Label className="text-[10px]">Texte CTA</Label>
          <Input value={data.ctaText} onChange={e => set("ctaText", e.target.value)} className="h-7 text-xs mt-0.5" />
        </div>
      )}
      {data.text !== undefined && (
        <div>
          <Label className="text-[10px]">Texte</Label>
          <Textarea value={data.text} onChange={e => set("text", e.target.value)} className="text-xs mt-0.5" rows={3} />
        </div>
      )}
      {data.content !== undefined && (
        <div>
          <Label className="text-[10px]">Contenu</Label>
          <Textarea value={data.content} onChange={e => set("content", e.target.value)} className="text-xs mt-0.5" rows={4} />
        </div>
      )}
      {data.imageUrl !== undefined && (
        <div>
          <ImageUploader value={data.imageUrl} onChange={(v) => set("imageUrl", v)} label="Image" />
          <AiImageBtn field="imageUrl" onAiImage={onAiImage} />
        </div>
      )}
      {data.url !== undefined && section.type === "image" && (
        <div>
          <ImageUploader value={data.url} onChange={(v) => set("url", v)} label="Image" />
          <AiImageBtn field="url" onAiImage={onAiImage} />
        </div>
      )}
      {data.url !== undefined && section.type !== "image" && (
        <div>
          <Label className="text-[10px]">URL</Label>
          <Input value={data.url} onChange={e => set("url", e.target.value)} className="h-7 text-xs mt-0.5" placeholder="https://..." />
        </div>
      )}
      {data.beforeImage !== undefined && (
        <div>
          <ImageUploader value={data.beforeImage} onChange={(v) => set("beforeImage", v)} label="Image Avant" />
          <AiImageBtn field="beforeImage" onAiImage={onAiImage} />
        </div>
      )}
      {data.afterImage !== undefined && (
        <div>
          <ImageUploader value={data.afterImage} onChange={(v) => set("afterImage", v)} label="Image Après" />
          <AiImageBtn field="afterImage" onAiImage={onAiImage} />
        </div>
      )}
      {data.poster !== undefined && (
        <ImageUploader value={data.poster} onChange={(v) => set("poster", v)} label="Poster vidéo" />
      )}
      {data.placeholder !== undefined && (
        <div>
          <Label className="text-[10px]">Placeholder</Label>
          <Input value={data.placeholder} onChange={e => set("placeholder", e.target.value)} className="h-7 text-xs mt-0.5" />
        </div>
      )}
      {data.buttonText !== undefined && (
        <div>
          <Label className="text-[10px]">Texte bouton</Label>
          <Input value={data.buttonText} onChange={e => set("buttonText", e.target.value)} className="h-7 text-xs mt-0.5" />
        </div>
      )}
      {data.phone !== undefined && (
        <div>
          <Label className="text-[10px]">Téléphone WhatsApp</Label>
          <Input value={data.phone} onChange={e => set("phone", e.target.value)} className="h-7 text-xs mt-0.5" placeholder="+237..." />
        </div>
      )}
      {data.message !== undefined && (
        <div>
          <Label className="text-[10px]">Message par défaut</Label>
          <Input value={data.message} onChange={e => set("message", e.target.value)} className="h-7 text-xs mt-0.5" />
        </div>
      )}
      {data.label !== undefined && (
        <div>
          <Label className="text-[10px]">Label</Label>
          <Input value={data.label} onChange={e => set("label", e.target.value)} className="h-7 text-xs mt-0.5" />
        </div>
      )}
      {data.endDate !== undefined && (
        <div>
          <Label className="text-[10px]">Date de fin</Label>
          <Input type="datetime-local" value={data.endDate?.slice(0, 16)} onChange={e => set("endDate", new Date(e.target.value).toISOString())} className="h-7 text-xs mt-0.5" />
        </div>
      )}
      {data.price !== undefined && typeof data.price === "string" && (
        <div>
          <Label className="text-[10px]">Prix affiché</Label>
          <Input value={data.price} onChange={e => set("price", e.target.value)} className="h-7 text-xs mt-0.5" />
        </div>
      )}

      {/* Store name for header/footer */}
      {data.storeName !== undefined && (
        <div>
          <Label className="text-[10px]">Nom boutique</Label>
          <Input value={data.storeName} onChange={e => set("storeName", e.target.value)} className="h-7 text-xs mt-0.5" />
        </div>
      )}
      {data.description !== undefined && (
        <div>
          <Label className="text-[10px]">Description</Label>
          <Textarea value={data.description} onChange={e => set("description", e.target.value)} className="text-xs mt-0.5" rows={2} />
        </div>
      )}
      {data.email !== undefined && (
        <div>
          <Label className="text-[10px]">Email</Label>
          <Input value={data.email} onChange={e => set("email", e.target.value)} className="h-7 text-xs mt-0.5" />
        </div>
      )}
      {data.incentive !== undefined && (
        <div>
          <Label className="text-[10px]">Incentive</Label>
          <Input value={data.incentive} onChange={e => set("incentive", e.target.value)} className="h-7 text-xs mt-0.5" />
        </div>
      )}
      {data.spotsText !== undefined && (
        <div>
          <Label className="text-[10px]">Texte places</Label>
          <Input value={data.spotsText} onChange={e => set("spotsText", e.target.value)} className="h-7 text-xs mt-0.5" />
        </div>
      )}

      {/* Logo */}
      {data.logo !== undefined && (
        <div>
          <ImageUploader value={data.logo} onChange={(v) => set("logo", v)} label="Logo" />
          <AiImageBtn field="logo" onAiImage={onAiImage} />
        </div>
      )}

      {/* Headers for comparison table */}
      {data.headers && Array.isArray(data.headers) && (
        <div>
          <Label className="text-[10px] mb-1 block">En-têtes</Label>
          {data.headers.map((h: string, i: number) => (
            <Input key={i} value={h} onChange={e => { const headers = [...data.headers]; headers[i] = e.target.value; set("headers", headers); }} className="h-6 text-[11px] mb-1" />
          ))}
        </div>
      )}
      {/* Rows for comparison table */}
      {data.rows && Array.isArray(data.rows) && (
        <div>
          <Label className="text-[10px] mb-1 block">Lignes ({data.rows.length})</Label>
          {data.rows.map((row: string[], ri: number) => (
            <div key={ri} className="flex gap-1 mb-1">
              {row.map((cell: string, ci: number) => (
                <Input key={ci} value={cell} onChange={e => { const rows = data.rows.map((r: string[]) => [...r]); rows[ri][ci] = e.target.value; set("rows", rows); }} className="h-6 text-[10px]" />
              ))}
              <button onClick={() => { const rows = data.rows.filter((_: any, j: number) => j !== ri); set("rows", rows); }} className="text-[10px] text-destructive shrink-0">✕</button>
            </div>
          ))}
          <Button size="sm" variant="outline" className="w-full h-6 text-[10px]" onClick={() => set("rows", [...data.rows, data.headers.map(() => "")])}>
            <Plus className="w-3 h-3 mr-1" /> Ligne
          </Button>
        </div>
      )}

      {/* Links array (header/footer) */}
      {data.links && Array.isArray(data.links) && (
        <div>
          <Label className="text-[10px] mb-1 block">Liens ({data.links.length})</Label>
          {data.links.map((link: any, i: number) => (
            <div key={i} className="flex gap-1 mb-1">
              <Input value={link.label} onChange={e => { const links = [...data.links]; links[i] = { ...links[i], label: e.target.value }; set("links", links); }} className="h-6 text-[10px]" placeholder="Label" />
              <Input value={link.href} onChange={e => { const links = [...data.links]; links[i] = { ...links[i], href: e.target.value }; set("links", links); }} className="h-6 text-[10px]" placeholder="URL" />
              <button onClick={() => set("links", data.links.filter((_: any, j: number) => j !== i))} className="text-[10px] text-destructive shrink-0">✕</button>
            </div>
          ))}
          <Button size="sm" variant="outline" className="w-full h-6 text-[10px]" onClick={() => set("links", [...data.links, { label: "", href: "#" }])}>
            <Plus className="w-3 h-3 mr-1" /> Lien
          </Button>
        </div>
      )}

      {/* Gallery images */}
      {data.images && Array.isArray(data.images) && section.type === "gallery" && (
        <div>
          <Label className="text-[10px] mb-1 block">Images ({data.images.length})</Label>
          {data.images.map((img: string, i: number) => (
            <div key={i} className="flex gap-1 mb-1 items-center">
              {img && <img src={img} alt="" className="w-8 h-8 rounded object-cover shrink-0" />}
              <Input value={img} onChange={e => { const images = [...data.images]; images[i] = e.target.value; set("images", images); }} className="h-6 text-[10px] flex-1" placeholder="URL image" />
              <button onClick={() => set("images", data.images.filter((_: any, j: number) => j !== i))} className="text-[10px] text-destructive shrink-0">✕</button>
            </div>
          ))}
          <Button size="sm" variant="outline" className="w-full h-6 text-[10px]" onClick={() => set("images", [...data.images, ""])}>
            <Plus className="w-3 h-3 mr-1" /> Image
          </Button>
        </div>
      )}

      {/* Socials for footer */}
      {data.socials && typeof data.socials === "object" && !Array.isArray(data.socials) && (
        <div>
          <Label className="text-[10px] mb-1 block">Réseaux sociaux</Label>
          {Object.entries(data.socials).map(([key, value]) => (
            <div key={key} className="flex gap-1 mb-1 items-center">
              <span className="text-[10px] text-muted-foreground w-16 shrink-0 capitalize">{key}</span>
              <Input value={value as string} onChange={e => set("socials", { ...data.socials, [key]: e.target.value })} className="h-6 text-[10px] flex-1" placeholder={`URL ${key}`} />
            </div>
          ))}
        </div>
      )}

      {/* Items array editor (generic) */}
      {data.items && Array.isArray(data.items) && (
        <div>
          <Label className="text-[10px] mb-1 block">{section.type === "faq" ? "Questions" : section.type === "pricing" ? "Offres" : "Éléments"} ({data.items.length})</Label>
          {data.items.map((item: any, i: number) => (
            <div key={i} className="p-2 border border-border rounded mb-1.5 space-y-1">
              {item.title !== undefined && <Input value={item.title} onChange={e => { const items = [...data.items]; items[i] = { ...items[i], title: e.target.value }; set("items", items); }} className="h-6 text-[10px]" placeholder="Titre" />}
              {item.name !== undefined && <Input value={item.name} onChange={e => { const items = [...data.items]; items[i] = { ...items[i], name: e.target.value }; set("items", items); }} className="h-6 text-[10px]" placeholder="Nom" />}
              {item.desc !== undefined && <Input value={item.desc} onChange={e => { const items = [...data.items]; items[i] = { ...items[i], desc: e.target.value }; set("items", items); }} className="h-6 text-[10px]" placeholder="Description" />}
              {item.content !== undefined && <Input value={item.content} onChange={e => { const items = [...data.items]; items[i] = { ...items[i], content: e.target.value }; set("items", items); }} className="h-6 text-[10px]" placeholder="Contenu" />}
              {item.label !== undefined && <Input value={item.label} onChange={e => { const items = [...data.items]; items[i] = { ...items[i], label: e.target.value }; set("items", items); }} className="h-6 text-[10px]" placeholder="Label" />}
              {item.value !== undefined && <Input value={item.value} onChange={e => { const items = [...data.items]; items[i] = { ...items[i], value: e.target.value }; set("items", items); }} className="h-6 text-[10px]" placeholder="Valeur" />}
              {item.text !== undefined && <Input value={item.text} onChange={e => { const items = [...data.items]; items[i] = { ...items[i], text: e.target.value }; set("items", items); }} className="h-6 text-[10px]" placeholder="Texte" />}
              {item.q !== undefined && <Input value={item.q} onChange={e => { const items = [...data.items]; items[i] = { ...items[i], q: e.target.value }; set("items", items); }} className="h-6 text-[10px]" placeholder="Question" />}
              {item.a !== undefined && <Textarea value={item.a} onChange={e => { const items = [...data.items]; items[i] = { ...items[i], a: e.target.value }; set("items", items); }} className="text-[10px] min-h-[40px]" placeholder="Réponse" />}
              {item.icon !== undefined && <Input value={item.icon} onChange={e => { const items = [...data.items]; items[i] = { ...items[i], icon: e.target.value }; set("items", items); }} className="h-6 text-[10px]" placeholder="Icône (emoji)" />}
              {item.price !== undefined && <Input type="number" value={item.price} onChange={e => { const items = [...data.items]; items[i] = { ...items[i], price: Number(e.target.value) }; set("items", items); }} className="h-6 text-[10px]" placeholder="Prix" />}
              {item.originalPrice !== undefined && <Input type="number" value={item.originalPrice || ""} onChange={e => { const items = [...data.items]; items[i] = { ...items[i], originalPrice: Number(e.target.value) || null }; set("items", items); }} className="h-6 text-[10px]" placeholder="Ancien prix" />}
              {item.features !== undefined && Array.isArray(item.features) && (
                <div className="pl-2 space-y-0.5">
                  <Label className="text-[9px] text-muted-foreground">Features</Label>
                  {item.features.map((f: string, fi: number) => (
                    <div key={fi} className="flex gap-1">
                      <Input value={f} onChange={e => { const items = [...data.items]; const features = [...items[i].features]; features[fi] = e.target.value; items[i] = { ...items[i], features }; set("items", items); }} className="h-5 text-[9px]" />
                      <button onClick={() => { const items = [...data.items]; const features = items[i].features.filter((_: any, j: number) => j !== fi); items[i] = { ...items[i], features }; set("items", items); }} className="text-[9px] text-destructive">✕</button>
                    </div>
                  ))}
                  <button onClick={() => { const items = [...data.items]; items[i] = { ...items[i], features: [...(items[i].features || []), ""] }; set("items", items); }} className="text-[9px] text-primary">+ Feature</button>
                </div>
              )}
              {item.rating !== undefined && <Input type="number" min={1} max={5} value={item.rating} onChange={e => { const items = [...data.items]; items[i] = { ...items[i], rating: Number(e.target.value) }; set("items", items); }} className="h-6 text-[10px]" placeholder="Note /5" />}
              {item.highlight !== undefined && (
                <label className="flex items-center gap-1 text-[10px]">
                  <input type="checkbox" checked={item.highlight} onChange={e => { const items = [...data.items]; items[i] = { ...items[i], highlight: e.target.checked }; set("items", items); }} />
                  Mettre en avant
                </label>
              )}
              <button onClick={() => set("items", data.items.filter((_: any, j: number) => j !== i))} className="text-[9px] text-destructive">Supprimer</button>
            </div>
          ))}
          <Button size="sm" variant="outline" className="w-full h-6 text-[10px]" onClick={() => {
            const template = data.items[0] || {};
            const newItem: any = {};
            Object.keys(template).forEach(k => { newItem[k] = typeof template[k] === "number" ? 0 : typeof template[k] === "boolean" ? false : Array.isArray(template[k]) ? [] : ""; });
            set("items", [...data.items, newItem]);
          }}>
            <Plus className="w-3 h-3 mr-1" /> Ajouter
          </Button>
        </div>
      )}

      {/* Stats for social-proof */}
      {data.stats && Array.isArray(data.stats) && (
        <div>
          <Label className="text-[10px] mb-1 block">Statistiques ({data.stats.length})</Label>
          {data.stats.map((stat: any, i: number) => (
            <div key={i} className="flex gap-1 mb-1">
              <Input value={stat.value} onChange={e => { const stats = [...data.stats]; stats[i] = { ...stats[i], value: e.target.value }; set("stats", stats); }} className="h-6 text-[10px]" placeholder="Valeur" />
              <Input value={stat.label} onChange={e => { const stats = [...data.stats]; stats[i] = { ...stats[i], label: e.target.value }; set("stats", stats); }} className="h-6 text-[10px]" placeholder="Label" />
              <button onClick={() => set("stats", data.stats.filter((_: any, j: number) => j !== i))} className="text-[10px] text-destructive shrink-0">✕</button>
            </div>
          ))}
          <Button size="sm" variant="outline" className="w-full h-6 text-[10px]" onClick={() => set("stats", [...data.stats, { value: "", label: "" }])}>
            <Plus className="w-3 h-3 mr-1" /> Stat
          </Button>
        </div>
      )}

      {/* Testimonials for social-proof */}
      {data.testimonials && Array.isArray(data.testimonials) && (
        <div>
          <Label className="text-[10px] mb-1 block">Témoignages ({data.testimonials.length})</Label>
          {data.testimonials.map((t: any, i: number) => (
            <div key={i} className="p-2 border border-border rounded mb-1.5 space-y-1">
              <Input value={t.name} onChange={e => { const testimonials = [...data.testimonials]; testimonials[i] = { ...testimonials[i], name: e.target.value }; set("testimonials", testimonials); }} className="h-6 text-[10px]" placeholder="Nom" />
              <Input value={t.text} onChange={e => { const testimonials = [...data.testimonials]; testimonials[i] = { ...testimonials[i], text: e.target.value }; set("testimonials", testimonials); }} className="h-6 text-[10px]" placeholder="Témoignage" />
              <Input type="number" min={1} max={5} value={t.rating} onChange={e => { const testimonials = [...data.testimonials]; testimonials[i] = { ...testimonials[i], rating: Number(e.target.value) }; set("testimonials", testimonials); }} className="h-6 text-[10px]" placeholder="Note" />
              <button onClick={() => set("testimonials", data.testimonials.filter((_: any, j: number) => j !== i))} className="text-[9px] text-destructive">Supprimer</button>
            </div>
          ))}
          <Button size="sm" variant="outline" className="w-full h-6 text-[10px]" onClick={() => set("testimonials", [...data.testimonials, { name: "", text: "", rating: 5 }])}>
            <Plus className="w-3 h-3 mr-1" /> Témoignage
          </Button>
        </div>
      )}

      {/* Columns count */}
      {data.columns !== undefined && (
        <div>
          <Label className="text-[10px]">Nombre de colonnes</Label>
          <Input type="number" min={1} max={6} value={data.columns} onChange={e => set("columns", Number(e.target.value))} className="h-7 text-xs mt-0.5" />
        </div>
      )}

      {/* Autoplay for video */}
      {data.autoplay !== undefined && (
        <label className="flex items-center gap-2 text-[10px]">
          <input type="checkbox" checked={data.autoplay} onChange={e => set("autoplay", e.target.checked)} />
          Lecture automatique
        </label>
      )}

      {/* Announcement bar bg color */}
      {data.bgColor !== undefined && (
        <div>
          <Label className="text-[10px]">Couleur de fond</Label>
          <div className="flex items-center gap-2 mt-1">
            <input type="color" value={data.bgColor || "#000000"} onChange={(e) => set("bgColor", e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0" />
            <Input value={data.bgColor || ""} onChange={e => set("bgColor", e.target.value)} className="h-7 text-[10px] flex-1" placeholder="Thème par défaut" />
          </div>
        </div>
      )}

      {/* CTA Href */}
      {data.ctaHref !== undefined && (
        <div>
          <Label className="text-[10px]">Lien CTA</Label>
          <Input value={data.ctaHref} onChange={e => set("ctaHref", e.target.value)} className="h-7 text-xs mt-0.5" placeholder="#cta" />
        </div>
      )}

      {/* Before/After labels */}
      {data.beforeLabel !== undefined && (
        <div>
          <Label className="text-[10px]">Label "Avant"</Label>
          <Input value={data.beforeLabel} onChange={e => set("beforeLabel", e.target.value)} className="h-7 text-xs mt-0.5" />
        </div>
      )}
      {data.afterLabel !== undefined && (
        <div>
          <Label className="text-[10px]">Label "Après"</Label>
          <Input value={data.afterLabel} onChange={e => set("afterLabel", e.target.value)} className="h-7 text-xs mt-0.5" />
        </div>
      )}
    </div>
  );
}
