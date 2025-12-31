import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tier pricing configuration
const TIER_CONFIG: Record<string, { name: string; amount: number }> = {
  plus: { name: 'AURRA Plus', amount: 9900 },   // ₹99
  pro: { name: 'AURRA Pro', amount: 29900 },    // ₹299
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tier, userId, userEmail, userName } = await req.json();
    console.log('Creating Razorpay subscription for tier:', tier, 'userId:', userId);

    const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');
    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      console.error('Razorpay credentials not configured');
      return new Response(
        JSON.stringify({ error: 'Payment gateway not configured. Please contact support.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
    const tierConfig = TIER_CONFIG[tier];
    
    if (!tierConfig) {
      return new Response(
        JSON.stringify({ error: 'Invalid subscription tier selected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try to create a plan first
    console.log('Creating Razorpay plan for tier:', tier);
    
    let planId: string | null = null;
    
    try {
      const planResponse = await fetch('https://api.razorpay.com/v1/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`,
        },
        body: JSON.stringify({
          period: 'monthly',
          interval: 1,
          item: {
            name: tierConfig.name,
            amount: tierConfig.amount,
            currency: 'INR',
            description: `${tierConfig.name} Monthly Subscription`,
          },
        }),
      });

      if (planResponse.ok) {
        const plan = await planResponse.json();
        planId = plan.id;
        console.log('Plan created successfully:', planId);
      } else {
        const errorText = await planResponse.text();
        console.log('Plans API not available, falling back to order-based billing:', errorText);
      }
    } catch (planError) {
      console.log('Error creating plan, will use order-based approach:', planError);
    }

    // If plan creation succeeded, create subscription
    if (planId) {
      const subscriptionData = {
        plan_id: planId,
        total_count: 12,
        quantity: 1,
        customer_notify: 1,
        notes: {
          tier,
          userId,
          product: tierConfig.name,
        },
      };

      console.log('Creating Razorpay subscription:', subscriptionData);

      const subResponse = await fetch('https://api.razorpay.com/v1/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`,
        },
        body: JSON.stringify(subscriptionData),
      });

      if (subResponse.ok) {
        const subscription = await subResponse.json();
        console.log('Razorpay subscription created:', subscription.id);

        // Save subscription record to database
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        await supabase.from('payments').insert({
          user_id: userId,
          razorpay_order_id: subscription.id,
          amount: tierConfig.amount,
          currency: 'INR',
          status: 'pending',
          tier: tier,
        });

        return new Response(
          JSON.stringify({
            subscriptionId: subscription.id,
            shortUrl: subscription.short_url,
            amount: tierConfig.amount,
            currency: 'INR',
            keyId: RAZORPAY_KEY_ID,
            tierName: tierConfig.name,
            planId: planId,
            isSubscription: true,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        const errorText = await subResponse.text();
        console.log('Subscription API error, falling back to order:', errorText);
      }
    }

    // Fallback: Create a regular order instead (for accounts without subscription access)
    console.log('Creating regular order as fallback for subscription');
    
    const orderData = {
      amount: tierConfig.amount,
      currency: 'INR',
      receipt: `sub_${tier}_${Date.now()}`.slice(0, 40),
      notes: {
        tier,
        userId,
        product: tierConfig.name,
        type: 'subscription_fallback',
      },
    };

    const orderResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify(orderData),
    });

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      console.error('Order creation failed:', errorText);
      return new Response(
        JSON.stringify({ error: 'Unable to create payment. Please try again later.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const order = await orderResponse.json();
    console.log('Order created as subscription fallback:', order.id);

    // Save payment record
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await supabase.from('payments').insert({
      user_id: userId,
      razorpay_order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      status: 'pending',
      tier: tier,
    });

    return new Response(
      JSON.stringify({
        orderId: order.id,
        subscriptionId: order.id, // For compatibility with frontend
        amount: order.amount,
        currency: order.currency,
        keyId: RAZORPAY_KEY_ID,
        tierName: tierConfig.name,
        isSubscription: false, // Frontend can show different messaging
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in subscription flow:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});