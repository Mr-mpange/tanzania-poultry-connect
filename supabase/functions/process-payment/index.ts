import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2/cors";

const SNIPPE_BASE_URL = "https://api.snippe.sh";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SNIPPE_API_KEY = Deno.env.get("SNIPPE_API_KEY");
    if (!SNIPPE_API_KEY) {
      throw new Error("SNIPPE_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase environment variables are not configured");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify the user
    const anonClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: userError } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "create_payment") {
      const { order_id, phone_number, amount } = body;

      if (!order_id || !phone_number || !amount) {
        return new Response(JSON.stringify({ error: "Missing required fields: order_id, phone_number, amount" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify the order belongs to this user
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", order_id)
        .eq("buyer_id", user.id)
        .single();

      if (orderError || !order) {
        return new Response(JSON.stringify({ error: "Order not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Normalize phone number to 255XXXXXXXXX format
      let normalizedPhone = phone_number.replace(/\s+/g, "").replace(/[^0-9]/g, "");
      if (normalizedPhone.startsWith("0")) {
        normalizedPhone = "255" + normalizedPhone.substring(1);
      } else if (!normalizedPhone.startsWith("255")) {
        normalizedPhone = "255" + normalizedPhone;
      }

      // Get buyer profile for customer info
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("user_id", user.id)
        .single();

      const nameParts = (profile?.full_name || "Customer").split(" ");
      const firstName = nameParts[0] || "Customer";
      const lastName = nameParts.slice(1).join(" ") || "User";

      const idempotencyKey = `order-${order_id}-${Date.now()}`;

      // Create Snippe mobile money payment
      const snippeResponse = await fetch(`${SNIPPE_BASE_URL}/v1/payments`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SNIPPE_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          payment_type: "mobile",
          details: {
            amount: Math.round(amount),
            currency: "TZS",
          },
          phone_number: normalizedPhone,
          customer: {
            firstname: firstName,
            lastname: lastName,
          },
          webhook_url: `${SUPABASE_URL}/functions/v1/snippe-webhook`,
          metadata: {
            order_id: order_id,
            order_number: order.order_number,
          },
        }),
      });

      const snippeData = await snippeResponse.json();

      if (!snippeResponse.ok) {
        console.error("Snippe API error:", JSON.stringify(snippeData));
        return new Response(JSON.stringify({ 
          error: "Payment initiation failed", 
          details: snippeData.message || "Failed to process payment" 
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Store payment reference
      const paymentRef = snippeData.data?.reference || snippeData.data?.id;
      if (paymentRef) {
        await supabase.from("orders").update({
          notes: `Payment ref: ${paymentRef}`,
        }).eq("id", order_id);
      }

      return new Response(JSON.stringify({
        success: true,
        message: "Payment request sent. Check your phone for the USSD prompt.",
        reference: paymentRef,
        data: snippeData.data,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "check_status") {
      const { reference } = body;
      if (!reference) {
        return new Response(JSON.stringify({ error: "Missing reference" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const snippeResponse = await fetch(`${SNIPPE_BASE_URL}/v1/payments/${reference}`, {
        headers: {
          "Authorization": `Bearer ${SNIPPE_API_KEY}`,
        },
      });

      const snippeData = await snippeResponse.json();

      return new Response(JSON.stringify({
        success: true,
        data: snippeData.data,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Payment error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
