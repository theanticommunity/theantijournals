import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY')!;
const paystackWebhookSecret = Deno.env.get('PAYSTACK_WEBHOOK_SECRET')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function verifyPaystackSignature(rawBody: Uint8Array, signatureHeader: string | null, webhookSecret: string): boolean {
  if (!signatureHeader || !webhookSecret) return false;

  const parts = signatureHeader.split(',');
  let timestamp: number | null = null;
  const signatures: string[] = [];

  for (const part of parts) {
    const kv = part.split('=');
    if (kv[0] === 't') timestamp = parseInt(kv[1], 10);
    if (kv[0] === 'v1') signatures.push(kv[1]);
  }

  if (!timestamp || signatures.length === 0) return false;

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) return false;

  const payload = timestamp + '.' + new TextDecoder().decode(rawBody);
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(webhookSecret),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );
  const expected = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const expectedHex = Array.from(new Uint8Array(expected))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  for (const sig of signatures) {
    if (/^[0-9a-f]{128}$/.test(sig)) {
      if (sig === expectedHex) return true;
    }
  }

  return false;
}

function verifyLegacySignature(rawBody: Uint8Array, signature: string | null, secretKey: string): boolean {
  if (!signature || !secretKey) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secretKey),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );
  const expected = await crypto.subtle.sign('HMAC', key, encoder.encode(new TextDecoder().decode(rawBody)));
  const expectedHex = Array.from(new Uint8Array(expected))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return signature === expectedHex;
}

async function grantEntitlement(
  userId: string,
  type: string,
  targetType: string,
  targetId: string,
  expiresAt: string | null,
  paymentId: string
) {
  // Check idempotency: don't create duplicate active entitlement
  const { data: existing } = await supabase
    .from('entitlements')
    .select('id')
    .eq('user_id', userId)
    .eq('type', type)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .is('revoked_at', null)
    .maybeSingle();

  if (existing) return;

  await supabase
    .from('entitlements')
    .insert({
      user_id: userId,
      type,
      target_type: targetType,
      target_id: targetId,
      expires_at: expiresAt,
    });

  // Write audit log
  await supabase
    .from('audit_log')
    .insert({
      actor_id: userId,
      action: 'grant_entitlement',
      target_type,
      target_id: targetId,
      metadata: { payment_id: paymentId, entitlement_type: type },
    });
}

async function activateSubscription(userId: string, plan: string, amount: number, currency: string, paystackReference: string) {
  const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // Default 30 days

  const { data: existing } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        plan,
        amount,
        currency,
        current_period_end: periodEnd,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan,
        amount,
        currency,
        interval: 'month',
        status: 'active',
        current_period_end: periodEnd,
      });
  }

  await supabase
    .from('profiles')
    .update({ membership: 'premium', subscription_status: 'active' })
    .eq('id', userId);

  await grantEntitlement(userId, 'subscription', 'plan', plan, null, paystackReference);
}

async function deactivateSubscription(userEmail: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', userEmail)
    .maybeSingle();

  if (profile) {
    await supabase
      .from('subscriptions')
      .update({ status: 'canceled', canceled_at: new Date().toISOString() })
      .eq('user_id', profile.id);

    await supabase
      .from('profiles')
      .update({ membership: 'free', subscription_status: 'canceled' })
      .eq('id', profile.id);
  }
}

Deno.serve(async (req) => {
  const rawBody = await req.arrayBuffer();
  const paystackSignature = req.headers.get('paystack-signature');
  const legacySignature = req.headers.get('x-paystack-signature');

  let verified = false;

  if (paystackSignature && paystackWebhookSecret) {
    verified = verifyPaystackSignature(new Uint8Array(rawBody), paystackSignature, paystackWebhookSecret);
  }

  if (!verified && legacySignature && paystackSecretKey) {
    verified = verifyLegacySignature(new Uint8Array(rawBody), legacySignature, paystackSecretKey);
  }

  if (!verified) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let event;
  try {
    event = JSON.parse(new TextDecoder().decode(rawBody));
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { event: eventType, data } = event;

  try {
    if (eventType === 'charge.success') {
      const { reference, metadata, amount, currency } = data;

      // Idempotency: check if payment already processed
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('id, status, user_id, type, reference_id')
        .eq('paystack_reference', reference)
        .maybeSingle();

      if (existingPayment && existingPayment.status === 'paid') {
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Update payment record
      if (existingPayment) {
        await supabase
          .from('payments')
          .update({ status: 'paid', updated_at: new Date().toISOString() })
          .eq('id', existingPayment.id);
      } else {
        // Create payment record from webhook data
        const userId = metadata?.user_id;
        await supabase
          .from('payments')
          .insert({
            user_id: userId,
            type: metadata?.type || 'publication',
            reference_id: metadata?.product_id,
            paystack_reference: reference,
            amount,
            currency,
            status: 'paid',
          });
      }

      const userId = metadata?.user_id;
      const paymentId = existingPayment?.id || crypto.randomUUID();

      if (metadata?.type === 'subscription') {
        const plan = metadata.plan;
        await activateSubscription(userId, plan, amount, currency, reference);
      }

      if (metadata?.type === 'purchase') {
        const purchase = await supabase
          .from('payments')
          .select('type, reference_id')
          .eq('paystack_reference', reference)
          .single();

        if (purchase.data && purchase.data.status !== 'paid') {
          await grantEntitlement(
            userId,
            'publication_purchase',
            'publication',
            purchase.data.reference_id,
            null,
            paymentId
          );
        }
      }
    }

    if (eventType === 'subscription.not_renewable' || eventType === 'subscription.disable') {
      const customerEmail = data.customer?.email;
      if (customerEmail) {
        await deactivateSubscription(customerEmail);
      }
    }

    if (eventType === 'charge.failed') {
      const { reference } = data;
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('paystack_reference', reference);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Webhook error:', err);
    return new Response(JSON.stringify({ error: 'Webhook processing failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
