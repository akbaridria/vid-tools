/**
 * Google Analytics 4 helper utilities.
 *
 * Usage:
 *   import { trackEvent } from "@/lib/analytics"
 *   trackEvent("video_processed", { format: "mp4", duration_ms: 12000 })
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void
  }
}

/** Track a custom GA4 event */
export function trackEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, params)
  }
}

/** Track a page view (useful if you add routing later) */
export function trackPageView(path: string, title?: string) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "page_view", {
      page_path: path,
      page_title: title,
    })
  }
}
