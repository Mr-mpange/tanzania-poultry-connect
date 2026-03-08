/**
 * Browser Push Notifications via the Web Notifications API.
 * Works when the tab is open (even if not focused).
 */

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function isNotificationSupported(): boolean {
  return "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}

const STATUS_EMOJI: Record<string, string> = {
  confirmed: "✅",
  processing: "📦",
  picked_up: "🚚",
  in_transit: "🛣️",
  delivered: "🎉",
  cancelled: "❌",
};

const STATUS_MESSAGES: Record<string, string> = {
  confirmed: "Your order has been confirmed by the farmer!",
  processing: "Your order is being prepared for dispatch.",
  picked_up: "A distributor has picked up your order!",
  in_transit: "Your order is on its way to you!",
  delivered: "Your order has been delivered. Enjoy!",
  cancelled: "Your order has been cancelled.",
};

export function sendBrowserNotification(
  orderNumber: string,
  status: string
): void {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const emoji = STATUS_EMOJI[status] || "📋";
  const body = STATUS_MESSAGES[status] || `Status updated to: ${status.replace("_", " ")}`;

  try {
    new Notification(`${emoji} Order #${orderNumber}`, {
      body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: `order-${orderNumber}-${status}`,
      renotify: true,
    });
  } catch {
    // Silent fail on environments that don't support Notification constructor
  }
}
