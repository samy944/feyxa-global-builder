import { useEffect } from "react";

interface SeoHeadProps {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "product";
  price?: number;
  currency?: string;
  availability?: "InStock" | "OutOfStock";
  brand?: string;
}

/**
 * Dynamically sets document title + meta/OG tags.
 * Cleans up on unmount to restore defaults.
 */
export function useSeoHead({
  title,
  description,
  image,
  url,
  type = "website",
  price,
  currency,
  availability,
  brand,
}: SeoHeadProps) {
  useEffect(() => {
    const prev = document.title;
    document.title = title;

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    if (description) {
      setMeta("name", "description", description);
      setMeta("property", "og:description", description);
      setMeta("name", "twitter:description", description);
    }

    setMeta("property", "og:title", title);
    setMeta("name", "twitter:title", title);
    setMeta("property", "og:type", type === "product" ? "product" : "website");

    if (image) {
      setMeta("property", "og:image", image);
      setMeta("name", "twitter:image", image);
    }

    if (url) {
      setMeta("property", "og:url", url);
    }

    if (type === "product" && price !== undefined && currency) {
      setMeta("property", "product:price:amount", price.toString());
      setMeta("property", "product:price:currency", currency);
    }

    // JSON-LD
    let scriptEl: HTMLScriptElement | null = null;
    if (type === "product" && price !== undefined) {
      scriptEl = document.createElement("script");
      scriptEl.type = "application/ld+json";
      scriptEl.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        name: title.replace(" — Feyxa Market", ""),
        description: description || "",
        image: image || undefined,
        brand: brand ? { "@type": "Brand", name: brand } : undefined,
        offers: {
          "@type": "Offer",
          price,
          priceCurrency: currency || "XOF",
          availability: availability === "OutOfStock"
            ? "https://schema.org/OutOfStock"
            : "https://schema.org/InStock",
          url,
        },
      });
      document.head.appendChild(scriptEl);
    }

    return () => {
      document.title = prev;
      if (scriptEl) scriptEl.remove();
    };
  }, [title, description, image, url, type, price, currency, availability, brand]);
}
