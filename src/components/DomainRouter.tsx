import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import StorefrontHome from "@/pages/StorefrontHome";
import StorefrontProduct from "@/pages/StorefrontProduct";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartDrawer } from "@/components/market/CartDrawer";

/**
 * DomainRouter: Detects if the current hostname is a vendor subdomain
 * or custom domain, and renders the storefront directly instead of the marketplace.
 *
 * Logic:
 * - "feyxa.com", "www.feyxa.com", "localhost", "*.lovable.app" → marketplace mode
 * - "boutique.feyxa.com" → storefront mode (slug = "boutique")
 * - "custom-domain.com" → lookup in stores table by custom_domain
 */

const PLATFORM_HOSTS = ["feyxa.com", "www.feyxa.com", "localhost", "127.0.0.1"];

interface DomainInfo {
  mode: "marketplace" | "storefront";
  storeSlug?: string;
}

export function getDomainInfo(): DomainInfo {
  const hostname = window.location.hostname;

  // localhost or preview → marketplace
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".lovable.app") ||
    hostname.endsWith(".lovableproject.com")
  ) {
    return { mode: "marketplace" };
  }

  // Main platform domain
  if (PLATFORM_HOSTS.includes(hostname)) {
    return { mode: "marketplace" };
  }

  // Subdomain of feyxa.com (e.g. boutique.feyxa.com)
  if (hostname.endsWith(".feyxa.com")) {
    const slug = hostname.replace(".feyxa.com", "");
    if (slug && slug !== "www" && slug !== "api") {
      return { mode: "storefront", storeSlug: slug };
    }
    return { mode: "marketplace" };
  }

  // Subdomain of feyxa.app (e.g. boutique.feyxa.app)
  if (hostname.endsWith(".feyxa.app")) {
    const slug = hostname.replace(".feyxa.app", "");
    if (slug && slug !== "www") {
      return { mode: "storefront", storeSlug: slug };
    }
    return { mode: "marketplace" };
  }

  // Custom domain — we need to look it up
  return { mode: "storefront", storeSlug: undefined };
}

export function useStorefrontDomain() {
  const [domainInfo] = useState(() => getDomainInfo());
  const [resolvedSlug, setResolvedSlug] = useState<string | null>(domainInfo.storeSlug || null);
  const [loading, setLoading] = useState(!domainInfo.storeSlug && domainInfo.mode === "storefront");

  useEffect(() => {
    // If it's a custom domain, resolve it
    if (domainInfo.mode === "storefront" && !domainInfo.storeSlug) {
      const hostname = window.location.hostname;
      (supabase as any)
        .from("stores")
        .select("slug")
        .eq("custom_domain", hostname)
        .eq("is_active", true)
        .single()
        .then(({ data }: any) => {
          if (data) setResolvedSlug(data.slug);
          setLoading(false);
        });
    }
  }, [domainInfo]);

  return {
    isStorefront: domainInfo.mode === "storefront",
    storeSlug: resolvedSlug,
    loading,
  };
}
