import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function isAdmin(userId: string): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  return profile?.role === 'admin';
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
    const { user_id, type, target_type, target_id, expires_at } = body;

    if (!user_id || !type || !target_type || !target_id) {
      return new Response(JSON.stringify({ error: 'user_id, type, target_type, target_id required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!['admin_assigned', 'promotional'].includes(type)) {
      return new Response(JSON.stringify({ error: 'Invalid entitlement type' }), {
        status: 422,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!['publication', 'collection'].includes(target_type)) {
      return new Response(JSON.stringify({ error: 'Invalid target_type' }), {
        status: 422,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check idempotency
    const { data: existing } = await supabase
      .from('entitlements')
      .select('id')
      .eq('user_id', user_id)
      .eq('type', type)
      .eq('target_type', target_type)
      .eq('target_id', target_id)
      .is('revoked_at', null)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: 'Entitlement already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data: entitlement, error } = await supabase
      .from('entitlements')
      .insert({
        user_id,
        type,
        target_type,
        target_id,
        granted_by: user.id,
        expires_at: expires_at || null,
      })
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Write audit log
    await supabase
      .from('audit_log')
      .insert({
        actor_id: user.id,
        action: 'grant_access',
        target_type,
        target_id,
        metadata: { entitlement_id: entitlement.id, granted_to: user_id },
      });

    return new Response(JSON.stringify({
      data: { entitlement_id: entitlement.id, created: true },
      error: null,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to grant access' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
