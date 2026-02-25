import { Link } from "react-router-dom";
import { useTranslation } from "@/lib/i18n";
import { useBranding } from "@/hooks/useBranding";
import { BrandLogo } from "@/components/landing/BrandLogo";

export function Footer() {
  const { t } = useTranslation();
  const branding = useBranding();

  const footerLinks = [
    { title: t.footer.product, links: [{ label: t.navbar.features, href: "/#features" }, { label: t.navbar.pricing, href: "/#pricing" }, { label: t.navbar.faq, href: "/#faq" }] },
    { title: t.navbar.marketplace, links: [{ label: t.market.home, href: "/market" }, { label: t.navbar.signup, href: "/signup" }] },
    { title: t.footer.company, links: [{ label: t.footer.about, href: "/#features" }, { label: t.footer.contact, href: "mailto:contact@feyxa.app" }] },
    { title: t.footer.legal, links: [{ label: t.footer.privacy, href: "/#" }, { label: t.footer.terms, href: "/#" }] },
  ];

  // Merge admin-configured footer links
  const extraLinks = branding.footer_links?.length
    ? [{ title: "Liens", links: branding.footer_links.map(l => ({ label: l.label, href: l.url })) }]
    : [];

  return (
    <footer className="border-t border-border bg-card/50 py-16">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4">
              <BrandLogo />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{t.footer.description}</p>
          </div>
          {[...footerLinks, ...extraLinks].map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold text-sm text-foreground mb-4">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            {branding.footer_text || `© ${new Date().getFullYear()} ${branding.platform_name}. ${t.footer.allRightsReserved}.`}
          </p>
        </div>
      </div>
    </footer>
  );
}
