import { supabase } from "@/integrations/supabase/client";

export async function sendSmsNotification(phone: string, message: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke("send-sms", {
      body: { phone, message },
    });

    if (error) {
      console.error("SMS send error:", error);
      return false;
    }

    return data?.success === true;
  } catch (err) {
    console.error("SMS send failed:", err);
    return false;
  }
}
