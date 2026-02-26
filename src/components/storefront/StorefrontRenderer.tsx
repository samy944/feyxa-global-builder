import { SFHeader } from "./sections/SFHeader";
import { SFHero } from "./sections/SFHero";
import { SFTrust } from "./sections/SFTrust";
import { SFCategories } from "./sections/SFCategories";
import { SFProductGrid } from "./sections/SFProductGrid";
import { SFTestimonials } from "./sections/SFTestimonials";
import { SFNewsletter } from "./sections/SFNewsletter";
import { SFFooter } from "./sections/SFFooter";
import { SFCartDrawer } from "./shared/SFCartDrawer";
import type { SFSectionProps } from "./types";
import type { SFSectionConfig, SFSectionType } from "@/lib/storefront-templates";

interface Props extends SFSectionProps {
  sectionsConfig: SFSectionConfig[];
}

export function StorefrontRenderer({ sectionsConfig, ...props }: Props) {
  const renderSection = (type: SFSectionType) => {
    const key = type;
    switch (type) {
      case "header": return <SFHeader key={key} {...props} />;
      case "hero": return <SFHero key={key} {...props} />;
      case "trust": return <SFTrust key={key} {...props} />;
      case "categories": return <SFCategories key={key} {...props} />;
      case "featured": return <SFProductGrid key={key} {...props} variant="featured" />;
      case "on-sale": return <SFProductGrid key={key} {...props} variant="on-sale" />;
      case "new-arrivals": return <SFProductGrid key={key} {...props} variant="new-arrivals" />;
      case "all-products": return <SFProductGrid key={key} {...props} variant="all-products" />;
      case "testimonials": return <SFTestimonials key={key} {...props} />;
      case "newsletter": return <SFNewsletter key={key} {...props} />;
      case "footer": return <SFFooter key={key} {...props} />;
      default: return null;
    }
  };

  return (
    <>
      {/* Branded cart drawer for this store */}
      <SFCartDrawer
        theme={props.theme}
        storeName={props.store.name}
        storeSlug={props.store.slug}
        currency={props.store.currency}
      />
      {sectionsConfig
        .filter((s) => s.visible)
        .map((s) => renderSection(s.type))}
    </>
  );
}
