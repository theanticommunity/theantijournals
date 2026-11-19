import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY')!;
const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:5173';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function paystackRequest(method: string, path: string, body: unknown = null) {
  const options: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${paystackSecretKey}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`https://api.paystack.co${path}`, options);
  return res.json();
}

Deno.serve(async (req) => {
  try {
    // Get the authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const jwt = authHeader.substring(7);
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const body = await req.json();
    const { product_type, product_id } = body;

    if (!product_type || !product_id) {
      return new Response(JSON.stringify({ error: 'product_type and product_id required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!['publication', 'collection', 'subscription'].includes(product_type)) {
      return new Response(JSON.stringify({ error: 'Invalid product_type' }), {
        status: 422,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Look up the product
    let price: number;
    if (product_type === 'subscription') {
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .or(`id.eq.${product_id},slug.eq.${product_id}`)
      .eq('is_active', true)
      .single();
      if (planError || !plan) {
        return new Response(JSON.stringify({ error: 'Subscription plan not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      price = plan.amount;
    } else {
      const { data: prod, error: prodError } = await supabase
        .from('products')
        .select('*')
        .eq('reference_id', product_id)
        .eq('type', product_type)
        .eq('is_active', true)
        .single();
      if (prodError || !prod) {
        return new Response(JSON.stringify({ error: 'Product not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      price = prod.price;
    }

    // Get user email from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single();

    // Create pending payment record
    const paymentId = crypto.randomUUID();
    const paystackReference = `anti_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        id: paymentId,
        user_id: user.id,
        type: product_type,
        reference_id: product_id,
        paystack_reference: paystackReference,
        amount: price,
        currency: 'NGN',
        status: 'pending',
      });

    if (paymentError) {
      return new Response(JSON.stringify({ error: 'Failed to create payment record' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Initialize Paystack transaction
    const initResp = await paystackRequest('POST', '/transaction/initialize', {
      email: profile?.email || user.email,
      amount: price,
      currency: 'NGN',
      metadata: {
        user_id: user.id,
        product_type,
        product_id,
        type: product_type,
        payment_id: paymentId,
      },
      callback_url: `${frontendUrl}/payment-success?reference=${paystackReference}`,
    });

    if (!initResp.status) {
      // Mark payment as failed
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('id', paymentId);
      return new Response(JSON.stringify({ error: initResp.message || 'Payment initialization failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      data: {
        authorization_url: initResp.data.authorization_url,
        reference: paystackReference,
      },
      error: null,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Payment initialization failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  });
