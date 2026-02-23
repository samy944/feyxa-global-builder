import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "feyxa_msid";

/** Get or create a persistent session ID */
export function getSessionId(): string {
  let sid = localStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

/** Parse UTM params from current URL */
export function getUtmParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get("utm_source") || null,
    medium: params.get("utm_medium") || null,
    campaign: params.get("utm_campaign") || null,
    content: params.get("utm_content") || null,
  };
}

/** Get referrer domain */
function getReferrerDomain(): string | null {
  try {
    if (!document.referrer) return null;
    const url = new URL(document.referrer);
    if (url.hostname === window.location.hostname) return null;
    return url.hostname;
  } catch {
    return null;
  }
}

/** Upsert tracking session for a store */
export async function upsertTrackingSession(storeId: string, trackingLinkId?: string | null) {
  const sessionId = getSessionId();
  const utm = getUtmParams();
  const referrer = getReferrerDomain();

  // Try update first (last touch)
  const { data: existing } = await supabase
    .from("tracking_sessions")
    .select("id")
    .eq("session_id", sessionId)
    .eq("store_id", storeId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("tracking_sessions")
      .update({
        last_source: utm.source,
        last_medium: utm.medium,
        last_campaign: utm.campaign,
        last_content: utm.content,
        last_referrer: referrer,
        last_tracking_link_id: trackingLinkId || null,
        last_seen_at: new Date().toISOString(),
        page_views: (existing as any).page_views ? (existing as any).page_views + 1 : 1,
      })
      .eq("id", existing.id);
  } else {
    await supabase
      .from("tracking_sessions")
      .insert({
        session_id: sessionId,
        store_id: storeId,
        first_source: utm.source,
        first_medium: utm.medium,
        first_campaign: utm.campaign,
        first_content: utm.content,
        first_referrer: referrer,
        first_tracking_link_id: trackingLinkId || null,
        last_source: utm.source,
        last_medium: utm.medium,
        last_campaign: utm.campaign,
        last_content: utm.content,
        last_referrer: referrer,
        last_tracking_link_id: trackingLinkId || null,
      });
  }
}

/** Record an analytics event */
export async function recordAnalyticsEvent(
  storeId: string,
  eventType: string,
  productId?: string | null,
  value: number = 0,
  currency: string = "XOF",
  metadata?: Record<string, any>
) {
  const sessionId = getSessionId();
  await supabase.from("analytics_events").insert({
    store_id: storeId,
    session_id: sessionId,
    product_id: productId || null,
    event_type: eventType,
    event_value: value,
    currency,
    metadata: metadata || {},
  }).then(() => {}); // fire-and-forget
}

/** Create order attribution from current session */
export async function createOrderAttribution(orderId: string, storeId: string, trackingLinkId?: string | null) {
  const sessionId = getSessionId();

  // Get session data for attribution
  const { data: session } = await supabase
    .from("tracking_sessions")
    .select("*")
    .eq("session_id", sessionId)
    .eq("store_id", storeId)
    .maybeSingle();

  await supabase.from("order_attributions").insert({
    order_id: orderId,
    store_id: storeId,
    session_id: sessionId,
    last_source: session?.last_source || null,
    last_medium: session?.last_medium || null,
    last_campaign: session?.last_campaign || null,
    last_content: session?.last_content || null,
    tracking_link_id: session?.last_tracking_link_id || trackingLinkId || null,
    first_source: session?.first_source || null,
    first_medium: session?.first_medium || null,
    first_campaign: session?.first_campaign || null,
    first_content: session?.first_content || null,
  });
}
