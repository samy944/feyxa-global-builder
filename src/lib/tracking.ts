import { supabase } from "@/integrations/supabase/client";

// --- Types ---

interface TrackingSettings {
  meta_pixel_id: string | null;
  tiktok_pixel_id: string | null;
  google_tag_id: string | null;
  snapchat_pixel_id: string | null;
  pinterest_tag_id: string | null;
}

interface PurchaseItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface PurchaseData {
  orderId: string;
  orderNumber: string;
  value: number;
  currency: string;
  items: PurchaseItem[];
}

// --- Pixel Injection ---

let injectedStoreId: string | null = null;

function injectScript(id: string, src: string) {
  if (document.getElementById(id)) return;
  const s = document.createElement("script");
  s.id = id;
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

function injectInlineScript(id: string, code: string) {
  if (document.getElementById(id)) return;
  const s = document.createElement("script");
  s.id = id;
  s.textContent = code;
  document.head.appendChild(s);
}

function injectMetaPixel(pixelId: string) {
  injectInlineScript(
    "feyxa-meta-pixel",
    `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');`
  );
}

function injectTikTokPixel(pixelId: string) {
  injectInlineScript(
    "feyxa-tiktok-pixel",
    `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=r;ttq._t=ttq._t||{};ttq._t[e+o]=+new Date;(function(t,e){var n=t.getElementsByTagName("script")[0],i=t.createElement("script");i.async=!0;i.src=e;n.parentNode.insertBefore(i,n)})(d,r+"?sdkid="+e+"&lib="+t)};ttq.load('${pixelId}');ttq.page();}(window,document,'ttq');`
  );
}

function injectGoogleTag(tagId: string) {
  injectScript("feyxa-gtag-js", `https://www.googletagmanager.com/gtag/js?id=${tagId}`);
  injectInlineScript(
    "feyxa-gtag-config",
    `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${tagId}');`
  );
}

function injectSnapchatPixel(pixelId: string) {
  injectInlineScript(
    "feyxa-snap-pixel",
    `(function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];var s=t.createElement('script');s.async=!0;s.src=n;var r=t.getElementsByTagName('script')[0];r.parentNode.insertBefore(s,r)})(window,document,'https://sc-static.net/scevent.min.js');snaptr('init','${pixelId}',{});snaptr('track','PAGE_VIEW');`
  );
}

function injectPinterestTag(tagId: string) {
  injectInlineScript(
    "feyxa-pinterest-tag",
    `!function(e){if(!window.pintrk){window.pintrk=function(){window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var n=window.pintrk;n.queue=[],n.version="3.0";var t=document.createElement("script");t.async=!0,t.src=e;var r=document.getElementsByTagName("script")[0];r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");pintrk('load','${tagId}');pintrk('page');`
  );
}

// --- Event Recording ---

let currentStoreId: string | null = null;
let currentCurrency: string = "XOF";

function recordEvent(eventType: string, value: number = 0) {
  if (!currentStoreId) return;
  // Fire-and-forget to edge function
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/record-tracking-event`;
  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({
      store_id: currentStoreId,
      event_type: eventType,
      value,
      currency: currentCurrency,
    }),
  }).catch(() => {}); // silent fail
}

// --- Public API ---

export async function initStoreTracking(storeId: string, currency?: string) {
  currentStoreId = storeId;
  if (currency) currentCurrency = currency;

  if (injectedStoreId === storeId) return; // already injected

  const { data } = await supabase
    .from("store_tracking_settings")
    .select("meta_pixel_id, tiktok_pixel_id, google_tag_id, snapchat_pixel_id, pinterest_tag_id")
    .eq("store_id", storeId)
    .maybeSingle();

  if (!data) return;

  if (data.meta_pixel_id) injectMetaPixel(data.meta_pixel_id);
  if (data.tiktok_pixel_id) injectTikTokPixel(data.tiktok_pixel_id);
  if (data.google_tag_id) injectGoogleTag(data.google_tag_id);
  if (data.snapchat_pixel_id) injectSnapchatPixel(data.snapchat_pixel_id);
  if (data.pinterest_tag_id) injectPinterestTag(data.pinterest_tag_id);

  injectedStoreId = storeId;
}

// --- Event Helpers ---

function fbq(...args: any[]) {
  if (typeof window !== "undefined" && (window as any).fbq) {
    (window as any).fbq(...args);
  }
}

function ttq(method: string, ...args: any[]) {
  if (typeof window !== "undefined" && (window as any).ttq) {
    (window as any).ttq[method]?.(...args);
  }
}

function gtag(...args: any[]) {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag(...args);
  }
}

function snaptr(method: string, ...args: any[]) {
  if (typeof window !== "undefined" && (window as any).snaptr) {
    (window as any).snaptr(method, ...args);
  }
}

function pintrk(method: string, ...args: any[]) {
  if (typeof window !== "undefined" && (window as any).pintrk) {
    (window as any).pintrk(method, ...args);
  }
}

// --- Tracking Events ---

export function trackPageView() {
  recordEvent("page_view");
  fbq("track", "PageView");
  snaptr("track", "PAGE_VIEW");
  pintrk("page");
  // TikTok pageview is automatic on load
  // gtag pageview is automatic via config
}

export function trackViewContent(product: { id: string; name: string; price: number; currency: string; category?: string }) {
  recordEvent("view_content", product.price);
  fbq("track", "ViewContent", {
    content_ids: [product.id],
    content_name: product.name,
    content_type: "product",
    value: product.price,
    currency: product.currency,
  });

  ttq("track", "ViewContent", {
    content_id: product.id,
    content_name: product.name,
    content_type: "product",
    value: product.price,
    currency: product.currency,
  });

  gtag("event", "view_item", {
    currency: product.currency,
    value: product.price,
    items: [{ item_id: product.id, item_name: product.name, price: product.price, item_category: product.category }],
  });

  snaptr("track", "VIEW_CONTENT", {
    content_ids: [product.id],
    content_name: product.name,
    content_type: "product",
    value: product.price,
    currency: product.currency,
  });

  pintrk("track", "pagevisit", {
    product_id: product.id,
    product_name: product.name,
    product_price: product.price,
    product_currency: product.currency,
  });
}

export function trackAddToCart(product: { id: string; name: string; price: number; currency: string; quantity: number }) {
  recordEvent("add_to_cart", product.price * product.quantity);
  fbq("track", "AddToCart", {
    content_ids: [product.id],
    content_name: product.name,
    content_type: "product",
    value: product.price * product.quantity,
    currency: product.currency,
    num_items: product.quantity,
  });

  ttq("track", "AddToCart", {
    content_id: product.id,
    content_name: product.name,
    content_type: "product",
    value: product.price * product.quantity,
    currency: product.currency,
    quantity: product.quantity,
  });

  gtag("event", "add_to_cart", {
    currency: product.currency,
    value: product.price * product.quantity,
    items: [{ item_id: product.id, item_name: product.name, price: product.price, quantity: product.quantity }],
  });

  snaptr("track", "ADD_CART", {
    content_ids: [product.id],
    content_name: product.name,
    value: product.price * product.quantity,
    currency: product.currency,
    num_items: product.quantity,
  });

  pintrk("track", "addtocart", {
    product_id: product.id,
    product_name: product.name,
    product_price: product.price,
    product_quantity: product.quantity,
    order_quantity: product.quantity,
    value: product.price * product.quantity,
    currency: product.currency,
  });
}

export function trackInitiateCheckout(value: number, currency: string, numItems: number) {
  recordEvent("initiate_checkout", value);
  fbq("track", "InitiateCheckout", {
    value,
    currency,
    num_items: numItems,
  });

  ttq("track", "InitiateCheckout", {
    value,
    currency,
    quantity: numItems,
  });

  gtag("event", "begin_checkout", {
    currency,
    value,
    items: [],
  });

  snaptr("track", "START_CHECKOUT", {
    value,
    currency,
    num_items: numItems,
  });

  pintrk("track", "checkout", {
    value,
    currency,
    order_quantity: numItems,
  });
}

export function trackPurchase(data: PurchaseData) {
  const contentIds = data.items.map((i) => i.id);
  const numItems = data.items.reduce((s, i) => s + i.quantity, 0);
  recordEvent("purchase", data.value);

  fbq("track", "Purchase", {
    content_ids: contentIds,
    content_type: "product",
    value: data.value,
    currency: data.currency,
    num_items: numItems,
    order_id: data.orderNumber,
  });

  ttq("track", "CompletePayment", {
    content_id: contentIds[0],
    content_type: "product",
    value: data.value,
    currency: data.currency,
    quantity: numItems,
  });

  gtag("event", "purchase", {
    transaction_id: data.orderNumber,
    value: data.value,
    currency: data.currency,
    items: data.items.map((i) => ({
      item_id: i.id,
      item_name: i.name,
      price: i.price,
      quantity: i.quantity,
    })),
  });

  snaptr("track", "PURCHASE", {
    content_ids: contentIds,
    value: data.value,
    currency: data.currency,
    num_items: numItems,
    transaction_id: data.orderNumber,
  });

  pintrk("track", "checkout", {
    value: data.value,
    currency: data.currency,
    order_quantity: numItems,
    order_id: data.orderNumber,
    product_ids: contentIds,
  });
}
