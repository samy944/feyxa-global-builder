import { useMemo } from "react";
import { Link } from "react-router-dom";
import type { SFSectionProps, NavItem } from "../types";

export function SFFooter({ templateId, store, theme }: SFSectionProps) {
  const navItems: NavItem[] = useMemo(() => {
    const sn = (store.settings as any)?.storefront_nav as NavItem[] | undefined;
    return sn || [{ url: "#", label: "Accueil" }, { url: "#produits", label: "Produits" }, { url: "#contact", label: "Contact" }];
  }, [store.settings]);

  const Logo = () => store.logo_url
    ? <img src={store.logo_url} alt={store.name} className="h-8 w-8 rounded object-cover" />
    : <div className="h-8 w-8 rounded flex items-center justify-center font-bold text-xs" style={{ backgroundColor: `hsl(${theme.colors.primary})`, color: `hsl(${theme.colors.primaryForeground})` }}>{store.name[0]}</div>;

  if (templateId === "minimal") {
    return (
      <footer className="border-t py-12" style={{ borderColor: `hsl(${theme.colors.border})` }}>
        <div className="container text-center">
          <span className="text-sm font-semibold" style={{ color: `hsl(${theme.colors.foreground})`, fontFamily: `"${theme.fonts.heading}", sans-serif` }}>{store.name}</span>
          <div className="flex justify-center gap-6 mt-4">
            {navItems.map((item, i) => <a key={i} href={item.url} className="text-xs hover:underline" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>{item.label}</a>)}
          </div>
          <p className="text-xs mt-6" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>
            © {new Date().getFullYear()} {store.name} · Propulsé par <Link to="/" className="hover:underline" style={{ color: `hsl(${theme.colors.primary})` }}>Feyxa</Link>
          </p>
        </div>
      </footer>
    );
  }

  if (templateId === "fashion") {
    return (
      <footer className="py-14" style={{ backgroundColor: `hsl(${theme.colors.card})` }}>
        <div className="container">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-8">
            <div className="sm:col-span-2">
              <span className="text-base font-bold uppercase tracking-wider" style={{ fontFamily: `"${theme.fonts.heading}", serif`, color: `hsl(${theme.colors.foreground})` }}>{store.name}</span>
              {store.description && <p className="text-xs mt-3 leading-relaxed max-w-sm" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>{store.description}</p>}
            </div>
            <div>
              <h4 className="text-[10px] uppercase tracking-[0.15em] font-semibold mb-3" style={{ color: `hsl(${theme.colors.foreground})` }}>Navigation</h4>
              <div className="space-y-2">{navItems.map((item, i) => <a key={i} href={item.url} className="block text-xs hover:underline" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>{item.label}</a>)}</div>
            </div>
            <div>
              <h4 className="text-[10px] uppercase tracking-[0.15em] font-semibold mb-3" style={{ color: `hsl(${theme.colors.foreground})` }}>Info</h4>
              <p className="text-xs" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>Devise : {store.currency}</p>
            </div>
          </div>
          <div className="border-t mt-10 pt-6" style={{ borderColor: `hsl(${theme.colors.border})` }}>
            <p className="text-xs text-center" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>
              © {new Date().getFullYear()} {store.name} · <Link to="/" className="hover:underline" style={{ color: `hsl(${theme.colors.primary})` }}>Feyxa</Link>
            </p>
          </div>
        </div>
      </footer>
    );
  }

  // tech, marketplace, default
  return (
    <footer className="border-t py-10" style={{ backgroundColor: `hsl(${theme.colors.card})`, borderColor: `hsl(${theme.colors.border})` }}>
      <div className="container">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3"><Logo /><span className="font-bold text-sm" style={{ fontFamily: `"${theme.fonts.heading}", sans-serif` }}>{store.name}</span></div>
            {store.description && <p className="text-xs leading-relaxed" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>{store.description}</p>}
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3" style={{ color: `hsl(${theme.colors.foreground})` }}>Navigation</h4>
            <div className="space-y-2">{navItems.map((item, i) => <a key={i} href={item.url} className="block text-xs hover:underline" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>{item.label}</a>)}</div>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3" style={{ color: `hsl(${theme.colors.foreground})` }}>Informations</h4>
            <div className="space-y-2 text-xs" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>
              <p>Devise : {store.currency}</p>
            </div>
          </div>
        </div>
        <div className="border-t mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderColor: `hsl(${theme.colors.border})` }}>
          <p className="text-xs" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>© {new Date().getFullYear()} {store.name}. Tous droits réservés.</p>
          <p className="text-xs" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>Propulsé par <Link to="/" className="hover:underline" style={{ color: `hsl(${theme.colors.primary})` }}>Feyxa</Link></p>
        </div>
      </div>
    </footer>
  );
}
