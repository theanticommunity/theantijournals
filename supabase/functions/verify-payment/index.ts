import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function paystackVerify(reference: string) {
  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${paystackSecretKey}`,
    },
  });
  return res.json();
}

Deno.serve(async (req) => {
  try {
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

    const url = new URL(req.url);
    let reference = url.pathname.split('/').pop();

    // Allow reference in body (functions.invoke) or URL path
    try {
      const body = await req.json().catch(() => null);
      if (body?.reference) reference = body.reference;
    } catch {
      // Ignore body parse errors; fall back to path
    }

    if (!reference) {
      return new Response(JSON.stringify({ error: 'Reference required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // First check local payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('paystack_reference', reference)
      .eq('user_id', user.id)
      .single();

    if (paymentError || !payment) {
      return new Response(JSON.stringify({ error: 'Payment not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify with Paystack
    const verifyResp = await paystackVerify(reference);
    if (!verifyResp.status) {
      return new Response(JSON.stringify({ error: 'Verification failed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { status, amount } = verifyResp.data;
    const paid = status === 'success';

    return new Response(JSON.stringify({
      data: {
        status,
        reference,
        amount,
        paid,
      },
      error: null,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Verification failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
