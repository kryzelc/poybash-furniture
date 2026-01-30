// ============================================
// Supabase Edge Function: verify-payment
// ============================================
// Staff endpoint to verify payment proof and update order status

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

    // Verify user is authenticated and is staff+
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Check user role
    const { data: userData, error: roleError } = await supabaseClient
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (
      roleError ||
      !["staff", "inventory-clerk", "admin", "owner"].includes(userData.role)
    ) {
      throw new Error("Insufficient permissions. Staff access required.");
    }

    // Parse request
    const { order_id, action, notes } = await req.json();

    if (!order_id || !action) {
      throw new Error("order_id and action (approved/rejected) required");
    }

    // Update payment status
    const { data: order, error: updateError } = await supabaseClient
      .from("orders")
      .update({
        payment_status: action === "approved" ? "verified" : "rejected",
        payment_verified_at:
          action === "approved" ? new Date().toISOString() : null,
        verified_by: user.id,
        notes: notes || null,
      })
      .eq("id", order_id)
      .select("order_number, payment_status")
      .single();

    if (updateError) {
      throw updateError;
    }

    // If approved, update order status to confirmed
    if (action === "approved") {
      await supabaseClient
        .from("orders")
        .update({ status: "confirmed" })
        .eq("id", order_id);
    }

    // Log audit trail
    await supabaseClient.rpc("create_audit_log", {
      p_action_type: "VERIFY_PAYMENT",
      p_entity_type: "orders",
      p_entity_id: order_id,
      p_entity_name: order.order_number,
      p_previous_value: null,
      p_new_value: { payment_status: order.payment_status },
      p_notes: `Payment ${action} by staff`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        order_number: order.order_number,
        payment_status: order.payment_status,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
