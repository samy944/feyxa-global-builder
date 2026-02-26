import { GridWidget } from "./GridBuilderTypes";

interface Props {
  widget: GridWidget;
  isSelected: boolean;
  onClick: () => void;
}

export function GridWidgetRenderer({ widget, isSelected, onClick }: Props) {
  const { type, data } = widget;

  const wrapperClass = `relative group cursor-pointer transition-all rounded ${
    isSelected
      ? "ring-2 ring-primary ring-offset-1"
      : "hover:ring-1 hover:ring-primary/40"
  }`;

  const renderContent = () => {
    switch (type) {
      case "heading": {
        const Tag = (data.level || "h2") as keyof JSX.IntrinsicElements;
        return <Tag className="font-heading" style={{ textAlign: data.align }}>{data.text}</Tag>;
      }
      case "text":
        return <p style={{ textAlign: data.align }} className="text-sm text-foreground/80 leading-relaxed">{data.text}</p>;
      case "image":
        return <img src={data.src} alt={data.alt} className="w-full rounded" style={{ objectFit: data.fit || "cover", maxHeight: data.maxHeight || "auto" }} />;
      case "button":
        return (
          <div style={{ textAlign: data.align || "left" }}>
            <span className={`inline-block px-5 py-2.5 rounded-md font-medium text-sm transition-colors ${
              data.variant === "outline" 
                ? "border border-primary text-primary" 
                : data.variant === "ghost"
                ? "text-primary hover:bg-primary/10"
                : "bg-primary text-primary-foreground"
            } ${data.size === "lg" ? "px-8 py-3 text-base" : data.size === "sm" ? "px-3 py-1.5 text-xs" : ""}`}>
              {data.text}
            </span>
          </div>
        );
      case "spacer":
        return <div style={{ height: data.height }} className="bg-muted/20 rounded border border-dashed border-border flex items-center justify-center text-[10px] text-muted-foreground">{data.height}px</div>;
      case "divider":
        return <hr style={{ borderStyle: data.style, borderColor: data.color || "hsl(var(--border))", borderWidth: `${data.thickness || 1}px 0 0 0` }} />;
      case "icon":
        return <div className="flex justify-center text-4xl" style={{ color: data.color || "hsl(var(--primary))" }}>⭐</div>;
      case "video":
        return data.url ? (
          <div className="aspect-video bg-muted rounded overflow-hidden">
            <iframe src={data.url} className="w-full h-full" allowFullScreen />
          </div>
        ) : (
          <div className="aspect-video bg-muted rounded flex items-center justify-center text-muted-foreground text-sm">🎬 Ajoutez une URL vidéo</div>
        );
      case "product-card":
        return (
          <div className="border border-border rounded-lg p-4 bg-card">
            <div className="aspect-square bg-muted rounded mb-3 flex items-center justify-center text-2xl">🛍️</div>
            <p className="font-medium text-sm text-foreground">Nom du produit</p>
            <p className="text-primary font-semibold text-sm mt-1">9 900 FCFA</p>
          </div>
        );
      case "countdown":
        return (
          <div className="text-center p-4">
            <p className="text-xs text-muted-foreground mb-2">{data.label}</p>
            <div className="flex justify-center gap-3">
              {["00", "12", "45", "30"].map((v, i) => (
                <div key={i} className="bg-card border border-border rounded-lg px-3 py-2">
                  <span className="text-xl font-bold font-mono text-foreground">{v}</span>
                  <span className="block text-[9px] text-muted-foreground">{["Jours", "Heures", "Min", "Sec"][i]}</span>
                </div>
              ))}
            </div>
          </div>
        );
      case "testimonial":
        return (
          <div className="p-4 bg-card rounded-lg border border-border">
            <p className="text-sm italic text-foreground/80 mb-2">"{data.quote}"</p>
            <p className="text-xs font-medium text-foreground">— {data.author}</p>
          </div>
        );
      case "price":
        return (
          <div className="text-center">
            {data.oldPrice && <span className="text-sm text-muted-foreground line-through mr-2">{data.oldPrice}</span>}
            <span className="text-2xl font-bold text-foreground">{data.amount}</span>
            <span className="text-sm text-muted-foreground ml-1">{data.currency}</span>
            {data.period && <span className="text-xs text-muted-foreground">/{data.period}</span>}
          </div>
        );
      case "badge":
        return (
          <div>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
              data.color === "destructive" ? "bg-destructive text-destructive-foreground"
                : data.color === "secondary" ? "bg-secondary text-secondary-foreground"
                : "bg-primary text-primary-foreground"
            }`}>{data.text}</span>
          </div>
        );
      default:
        return <div className="p-4 text-xs text-muted-foreground">Widget: {type}</div>;
    }
  };

  return (
    <div className={wrapperClass} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {renderContent()}
      {/* Hover label */}
      <div className="absolute -top-5 left-0 text-[9px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {type}
      </div>
    </div>
  );
}
