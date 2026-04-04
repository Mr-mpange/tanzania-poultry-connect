import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase environment variables not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const payload = await req.json();

    console.log("Snippe webhook received:", JSON.stringify(payload));

    const event = payload.event || payload.type;
    const paymentData = payload.data || payload;
    const reference = paymentData.reference || paymentData.id;
    const metadata = paymentData.metadata || {};
    const orderId = metadata.order_id;

    if (!orderId) {
      // Try to find order by payment reference in notes
      const { data: orders } = await supabase
        .from("orders")
        .select("id")
        .ilike("notes", `%${reference}%`)
        .limit(1);

      if (!orders || orders.length === 0) {
        console.error("No order found for reference:", reference);
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const foundOrderId = orders[0].id;

      if (event === "payment.completed" || event === "payment.success") {
        await supabase.from("orders").update({
          status: "confirmed",
          notes: `Payment completed. Ref: ${reference}`,
        }).eq("id", foundOrderId);
        console.log("Order confirmed via webhook:", foundOrderId);
      } else if (event === "payment.failed" || event === "payment.expired" || event === "payment.voided") {
        await supabase.from("orders").update({
          notes: `Payment ${event}. Ref: ${reference}`,
        }).eq("id", foundOrderId);
        console.log("Payment failed for order:", foundOrderId);
      }
    } else {
      if (event === "payment.completed" || event === "payment.success") {
        await supabase.from("orders").update({
          status: "confirmed",
          notes: `Payment completed. Ref: ${reference}`,
        }).eq("id", orderId);
        console.log("Order confirmed via webhook:", orderId);
      } else if (event === "payment.failed" || event === "payment.expired" || event === "payment.voided") {
        await supabase.from("orders").update({
          notes: `Payment ${event}. Ref: ${reference}`,
        }).eq("id", orderId);
        console.log("Payment failed for order:", orderId);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
