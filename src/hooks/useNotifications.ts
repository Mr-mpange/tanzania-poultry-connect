import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { sendBrowserNotification } from "@/lib/browserNotifications";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";

export interface AppNotification {
  id: string;
  message: string;
  detail?: string;
  timestamp: Date;
  read: boolean;
}

export function useNotifications() {
  const { user, role } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const addNotification = useCallback((message: string, detail?: string) => {
    setNotifications(prev => [
      { id: crypto.randomUUID(), message, detail, timestamp: new Date(), read: false },
      ...prev.slice(0, 49),
    ]);
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!user || !role) return;

    const channel = supabase
      .channel("notifications-bell")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
        const order = payload.new as any;
        if (role === "farmer" && order.farmer_id === user.id) {
          addNotification(`New order #${order.order_number}`, `TZS ${order.total_amount?.toLocaleString() || 0}`);
        } else if (role === "admin") {
          addNotification(`New order #${order.order_number}`, `TZS ${order.total_amount?.toLocaleString() || 0}`);
        } else if (role === "distributor") {
          addNotification(`New order available: #${order.order_number}`);
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, (payload) => {
        const order = payload.new as any;
        const old = payload.old as any;
        if (order.status !== old.status) {
          if (role === "buyer" && order.buyer_id === user.id) {
            addNotification(`Order #${order.order_number} → ${order.status.replace("_", " ")}`);
            sendBrowserNotification(order.order_number, order.status);
          } else if (role === "farmer" && order.farmer_id === user.id) {
            addNotification(`Order #${order.order_number} → ${order.status.replace("_", " ")}`);
          }
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "reviews" }, async (payload) => {
        const review = payload.new as any;
        if (role === "farmer") {
          // Check if the reviewed product belongs to this farmer
          const { data: inv } = await supabase.from("inventory").select("product_name, farmer_id").eq("id", review.inventory_id).maybeSingle();
          if (inv && inv.farmer_id === user.id) {
            addNotification(`New ${review.rating}★ review on "${inv.product_name}"`, review.comment || undefined);
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, role, addNotification]);

  return { notifications, unreadCount, markRead, markAllRead };
}
