// ============================================
// Supabase Edge Function: validate-coupon
// ============================================
// Secure coupon validation with rate limiting

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      },
    );

    const { coupon_code, order_total } = await req.json();

    if (!coupon_code || !order_total) {
      throw new Error("coupon_code and order_total required");
    }

    // Call database function with built-in rate limiting and validation
    const { data, error } = await supabaseClient.rpc("apply_coupon", {
      p_coupon_code: coupon_code,
      p_order_total: order_total,
    });

    if (error) {
      throw error;
    }

    const result = data[0];

    if (!result.success) {
      return new Response(
        JSON.stringify({
          valid: false,
          message: result.message,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    return new Response(
      JSON.stringify({
        valid: true,
        coupon_id: result.coupon_id,
        discount_amount: result.discount_amount,
        message: result.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        valid: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});
