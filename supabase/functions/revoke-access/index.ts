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
    const { entitlement_id } = body;

    if (!entitlement_id) {
      return new Response(JSON.stringify({ error: 'entitlement_id required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get entitlement details before revoking (for audit log)
    const { data: entitlement } = await supabase
      .from('entitlements')
      .select('user_id, type, target_type, target_id')
      .eq('id', entitlement_id)
      .is('revoked_at', null)
      .single();

    if (!entitlement) {
      return new Response(JSON.stringify({ error: 'Entitlement not found or already revoked' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { error } = await supabase
      .from('entitlements')
      .update({ revoked_at: new Date().toISOString(), revoked_by: user.id })
      .eq('id', entitlement_id);

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
        action: 'revoke_access',
        target_type: entitlement.target_type,
        target_id: entitlement.target_id,
        metadata: { entitlement_id, revoked_from: entitlement.user_id },
      });

    return new Response(JSON.stringify({
      data: { revoked: true },
      error: null,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to revoke access' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
