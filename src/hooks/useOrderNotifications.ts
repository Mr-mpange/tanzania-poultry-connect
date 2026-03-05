import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useOrderNotifications() {
  const { user, role } = useAuth();

  useEffect(() => {
    if (!user || !role) return;

    const channel = supabase
      .channel("order-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const order = payload.new as any;
          if (role === "farmer" && order.farmer_id === user.id) {
            toast.info(`🛒 New order received! #${order.order_number}`, {
              description: `TZS ${order.total_amount?.toLocaleString() || 0}`,
              duration: 6000,
            });
          } else if (role === "admin") {
            toast.info(`📦 New order placed: #${order.order_number}`, {
              description: `TZS ${order.total_amount?.toLocaleString() || 0}`,
              duration: 6000,
            });
          } else if (role === "distributor") {
            toast.info(`🚚 New order available for delivery: #${order.order_number}`, {
              duration: 5000,
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          const order = payload.new as any;
          const oldOrder = payload.old as any;
          if (order.status !== oldOrder.status) {
            if (role === "buyer" && order.buyer_id === user.id) {
              toast.info(`📋 Order #${order.order_number} → ${order.status.replace("_", " ")}`, {
                duration: 5000,
              });
            } else if (role === "farmer" && order.farmer_id === user.id) {
              toast.info(`📋 Order #${order.order_number} status: ${order.status.replace("_", " ")}`, {
                duration: 5000,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, role]);
}
