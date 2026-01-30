// ============================================
// Supabase Edge Function: place-order
// ============================================
// Secure server-side order placement with inventory reservation

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with user's auth
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      },
    );

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Parse request body
    const {
      items, // [{ product_id, variant_id, quantity, warehouse_source, price, name, color, size, image_url }]
      fulfillment,
      pickup_details,
      shipping_address,
      payment_method,
      payment_proof,
      coupon_code,
      is_reservation,
      reservation_percentage,
      subtotal,
      delivery_fee,
      total,
    } = await req.json();

    // Validate required fields
    if (!items || items.length === 0) {
      throw new Error("Order must contain at least one item");
    }

    // Transform items to match database function format
    const dbItems = items.map((item: any) => ({
      variant_id: item.variant_id,
      quantity: item.quantity,
      warehouse_id: item.warehouse_source || "Lorenzo", // Default warehouse
    }));

    // Start transaction by calling database function
    const { data: order, error: orderError } = await supabaseClient.rpc(
      "create_order_transaction",
      {
        p_user_id: user.id,
        p_items: dbItems,
        p_fulfillment: fulfillment,
        p_shipping_address: shipping_address,
        p_payment_method: payment_method,
        p_payment_proof: payment_proof || null,
        p_coupon_code: coupon_code || null,
        p_is_reservation: is_reservation || false,
        p_reservation_percentage: reservation_percentage || null,
      },
    );

    if (orderError) {
      console.error("Order creation error:", orderError);
      throw orderError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_id: order.order_id,
        order_number: order.order_number,
        total: order.total,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});
