import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function isAdmin(userId: string): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  return profile?.role === 'admin';
}

async function paystackRequest(method: string, path: string) {
  const res = await fetch(`https://api.paystack.co${path}`, {
    method,
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

    if (!(await isAdmin(user.id))) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { paystack_subscription_code } = body;

    if (!paystack_subscription_code) {
      return new Response(JSON.stringify({ error: 'paystack_subscription_code required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Find subscription by paystack code
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('paystack_subscription_code', paystack_subscription_code)
      .single();

    if (!subscription) {
      return new Response(JSON.stringify({ error: 'Subscription not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify with Paystack API
    const verifyResp = await paystackRequest('GET', `/subscription/${paystack_subscription_code}`);
    if (!verifyResp.status) {
      return new Response(JSON.stringify({ error: 'Paystack verification failed' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const subData = verifyResp.data;
    const paystackStatus = subData.status; // active, pending, canceled, etc.

    let newStatus: string;
    if (paystackStatus === 'active') newStatus = 'active';
    else if (paystackStatus === 'canceled' || paystackStatus === 'not_renewable') newStatus = 'canceled';
    else if (paystackStatus === 'past_due') newStatus = 'past_due';
    else newStatus = subscription.status;

    // Update subscription
    const { data: updated, error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id)
      .select()
      .single();

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Sync profile membership
    if (newStatus === 'active') {
      await supabase
        .from('profiles')
        .update({ membership: 'premium', subscription_status: 'active' })
        .eq('id', subscription.user_id);
    } else if (newStatus === 'canceled') {
      await supabase
        .from('profiles')
        .update({ membership: 'free', subscription_status: 'canceled' })
        .eq('id', subscription.user_id);
    }

    // Write audit log
    await supabase
      .from('audit_log')
      .insert({
        actor_id: user.id,
        action: 'sync_subscription',
        target_type: 'subscription',
        target_id: subscription.id,
        metadata: { paystack_subscription_code, old_status: subscription.status, new_status: newStatus },
      });

    return new Response(JSON.stringify({
      data: {
        status: updated.status,
        current_period_end: updated.current_period_end,
        user_id: updated.user_id,
      },
      error: null,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to sync subscription' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
