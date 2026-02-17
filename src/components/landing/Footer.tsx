import { Link } from "react-router-dom";

const footerLinks = [
  {
    title: "Produit",
    links: ["Fonctionnalités", "Tarifs", "Sécurité", "Changelog"],
  },
  {
    title: "Ressources",
    links: ["Documentation", "API", "Blog", "Status"],
  },
  {
    title: "Entreprise",
    links: ["À propos", "Carrières", "Contact", "Partenaires"],
  },
  {
    title: "Légal",
    links: ["Confidentialité", "CGU", "Cookies", "GDPR"],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 py-16">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">F</span>
              </div>
              <span className="font-bold text-lg tracking-tight text-foreground">Feyxa</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              La plateforme e-commerce nouvelle génération pour l'Afrique et le monde.
            </p>
          </div>

          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold text-sm text-foreground mb-4">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © 2026 Feyxa. Tous droits réservés.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">Construit avec ❤️ pour les entrepreneurs du monde entier.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
