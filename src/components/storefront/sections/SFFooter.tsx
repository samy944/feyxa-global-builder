import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Instagram, Facebook, Twitter } from "lucide-react";
import type { SFSectionProps, NavItem } from "../types";

export function SFFooter({ templateId, store, theme }: SFSectionProps) {
  const navItems: NavItem[] = useMemo(() => {
    const sn = (store.settings as any)?.storefront_nav as NavItem[] | undefined;
    return sn || [{ url: "#", label: "Accueil" }, { url: "#produits", label: "Produits" }, { url: "#contact", label: "Contact" }];
  }, [store.settings]);

  const Logo = () => store.logo_url
    ? <img src={store.logo_url} alt={store.name} className="h-8 w-8 rounded-lg object-cover" />
    : <div className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs" style={{ backgroundColor: `hsl(${theme.colors.primary})`, color: `hsl(${theme.colors.primaryForeground})` }}>{store.name[0]}</div>;

  const year = new Date().getFullYear();

  if (templateId === "minimal") {
    return (
      <footer className="border-t py-14" style={{ borderColor: `hsl(${theme.colors.border})` }}>
        <div className="container text-center">
          <span className="text-base font-semibold tracking-tight" style={{ color: `hsl(${theme.colors.foreground})`, fontFamily: `"${theme.fonts.heading}", sans-serif` }}>{store.name}</span>
          <div className="flex justify-center gap-8 mt-5">
            {navItems.map((item, i) => <a key={i} href={item.url} className="text-xs hover:underline transition-all" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>{item.label}</a>)}
          </div>
          <div className="flex justify-center gap-4 mt-6">
            {[Instagram, Facebook, Twitter].map((Icon, i) => (
              <a key={i} href="#" className="h-8 w-8 rounded-full flex items-center justify-center hover:opacity-60 transition-opacity" style={{ backgroundColor: `hsl(${theme.colors.muted})` }}>
                <Icon size={14} style={{ color: `hsl(${theme.colors.foreground})` }} />
              </a>
            ))}
          </div>
          <p className="text-xs mt-8" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>
            © {year} {store.name} · Propulsé par <Link to="/" className="hover:underline" style={{ color: `hsl(${theme.colors.primary})` }}>Feyxa</Link>
          </p>
        </div>
      </footer>
    );
  }

  if (templateId === "fashion") {
    return (
      <footer className="py-16" style={{ backgroundColor: `hsl(${theme.colors.card})` }}>
        <div className="container">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-10">
            <div className="sm:col-span-2">
              <span className="text-lg font-bold uppercase tracking-[0.08em]" style={{ fontFamily: `"${theme.fonts.heading}", serif`, color: `hsl(${theme.colors.foreground})` }}>{store.name}</span>
              {store.description && <p className="text-xs mt-4 leading-relaxed max-w-sm" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>{store.description}</p>}
              <div className="flex gap-3 mt-5">
                {[Instagram, Facebook, Twitter].map((Icon, i) => (
                  <a key={i} href="#" className="h-9 w-9 rounded-full border flex items-center justify-center hover:opacity-60 transition-opacity" style={{ borderColor: `hsl(${theme.colors.border})` }}>
                    <Icon size={14} style={{ color: `hsl(${theme.colors.foreground})` }} />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-[10px] uppercase tracking-[0.18em] font-semibold mb-4" style={{ color: `hsl(${theme.colors.foreground})` }}>Navigation</h4>
              <div className="space-y-2.5">{navItems.map((item, i) => <a key={i} href={item.url} className="block text-xs hover:underline" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>{item.label}</a>)}</div>
            </div>
            <div>
              <h4 className="text-[10px] uppercase tracking-[0.18em] font-semibold mb-4" style={{ color: `hsl(${theme.colors.foreground})` }}>Info</h4>
              <p className="text-xs" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>Devise : {store.currency}</p>
            </div>
          </div>
          <div className="border-t mt-12 pt-6" style={{ borderColor: `hsl(${theme.colors.border})` }}>
            <p className="text-xs text-center" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>
              © {year} {store.name} · <Link to="/" className="hover:underline" style={{ color: `hsl(${theme.colors.primary})` }}>Feyxa</Link>
            </p>
          </div>
        </div>
      </footer>
    );
  }

  // tech, marketplace, default
  return (
    <footer className="border-t py-12" style={{ backgroundColor: `hsl(${theme.colors.card})`, borderColor: `hsl(${theme.colors.border})` }}>
      <div className="container">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4"><Logo /><span className="font-bold text-sm" style={{ fontFamily: `"${theme.fonts.heading}", sans-serif` }}>{store.name}</span></div>
            {store.description && <p className="text-xs leading-relaxed max-w-xs" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>{store.description}</p>}
            <div className="flex gap-2 mt-5">
              {[Instagram, Facebook, Twitter].map((Icon, i) => (
                <a key={i} href="#" className="h-8 w-8 rounded-lg flex items-center justify-center hover:opacity-60 transition-opacity" style={{ backgroundColor: `hsl(${theme.colors.primary} / 0.08)` }}>
                  <Icon size={14} style={{ color: `hsl(${theme.colors.primary})` }} />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-4" style={{ color: `hsl(${theme.colors.foreground})` }}>Navigation</h4>
            <div className="space-y-2.5">{navItems.map((item, i) => <a key={i} href={item.url} className="block text-xs hover:underline" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>{item.label}</a>)}</div>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-4" style={{ color: `hsl(${theme.colors.foreground})` }}>Informations</h4>
            <div className="space-y-2.5 text-xs" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>
              <p>Devise : {store.currency}</p>
              <Link to="/account" className="block hover:underline">Mon compte</Link>
              <Link to="/account/orders" className="block hover:underline">Mes commandes</Link>
              <Link to="/account/wishlist" className="block hover:underline">Mes favoris</Link>
            </div>
          </div>
        </div>
        <div className="border-t mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderColor: `hsl(${theme.colors.border})` }}>
          <p className="text-xs" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>© {year} {store.name}. Tous droits réservés.</p>
          <p className="text-xs" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>Propulsé par <Link to="/" className="hover:underline font-medium" style={{ color: `hsl(${theme.colors.primary})` }}>Feyxa</Link></p>
        </div>
      </div>
    </footer>
  );
}
