const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BRIQ_API_URL = "https://karibu.briq.tz/v1/message/send-instant";
const SENDER_ID = "BRIQ";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const BRIQ_API_KEY = Deno.env.get("BRIQ_API_KEY");
    if (!BRIQ_API_KEY) {
      throw new Error("BRIQ_API_KEY is not configured");
    }

    const { phone, message } = await req.json();

    if (!phone || typeof phone !== "string" || phone.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "Valid phone number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Message content is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch(BRIQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": BRIQ_API_KEY,
      },
      body: JSON.stringify({
        content: message.trim(),
        recipients: [phone.trim()],
        sender_id: SENDER_ID,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`BRIQ API error [${response.status}]:`, data);
      throw new Error(`BRIQ API call failed [${response.status}]: ${JSON.stringify(data)}`);
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error sending SMS:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
