import type { StorefrontTheme } from "@/lib/storefront-themes";

export interface StoreData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  currency: string;
  theme: any;
  settings: any;
}

export interface ProductData {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  images: any;
  stock_quantity: number;
  category?: string | null;
  created_at: string;
}

export interface SFSectionProps {
  templateId: string;
  store: StoreData;
  products: ProductData[];
  theme: StorefrontTheme;
  formatPrice: (price: number) => string;
}

export interface NavItem {
  url: string;
  label: string;
}
