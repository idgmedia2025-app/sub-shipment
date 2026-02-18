import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* =========================================================
   CORS: si frontend-ka (Lovable/Vercel/etc) u wici karo
========================================================= */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/* =========================================================
   SERVER: Edge Function
========================================================= */
Deno.serve(async (req) => {
  // ---------- Preflight (OPTIONS) ----------
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    /* =========================================================
       1) ENV/SECRETS: URL + keys + site url
       - SITE_URL waa domain-ka app-kaaga (redirect set-password)
    ========================================================= */
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const SITE_URL = Deno.env.get("SITE_URL") || "";

    if (!SUPABASE_URL || !SERVICE_ROLE || !ANON_KEY) {
      return json(
        {
          error:
            "Missing env: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY. Add them in Supabase Edge Function Secrets.",
        },
        500,
      );
    }
    if (!SITE_URL) {
      return json(
        {
          error:
            "Missing env: SITE_URL. Set SITE_URL to your app domain e.g. https://app.gobrasimpex.com",
        },
        500,
      );
    }

    /* =========================================================
       2) BODY: action + payload
    ========================================================= */
    const body = await req.json().catch(() => null);
    if (!body || !body.action) return json({ error: "Missing action" }, 400);
    const { action, ...payload } = body;

    /* =========================================================
       3) ADMIN CLIENT (Service Role)
       - awood buuxda: auth admin + db writes
    ========================================================= */
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    /* =========================================================
       4) CALLER INFO: Ka hel user-ka Authorization Bearer token
       - getUser() waa reliable
    ========================================================= */
    const authHeader = req.headers.get("Authorization") || "";
    let callerId: string | null = null;
    let callerEmail: string | null = null;

    if (authHeader.startsWith("Bearer ")) {
      const userClient = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data, error } = await userClient.auth.getUser();
      if (!error && data?.user) {
        callerId = data.user.id;
        callerEmail = data.user.email ?? null;
      }
    }

    /* =========================================================
       5) Helper: Hubi caller-ka admin yahay
    ========================================================= */
    const isAdmin = async (): Promise<boolean> => {
      if (!callerId) return false;
      const { data } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", callerId)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    };

    /* =========================================================
       6) Helper: Hubi admin hore u jiro (bootstrap create_direct)
    ========================================================= */
    const adminExists = async (): Promise<boolean> => {
      const { data } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin")
        .limit(1);
      return (data?.length ?? 0) > 0;
    };

    /* =========================================================
       7) ACTION: create (ADMIN invite user)
       - haddii hore u invited yahay -> resend (error ma noqoto)
    ========================================================= */
    if (action === "create") {
      if (!(await isAdmin())) return json({ error: "Admin only" }, 403);

      const { email, full_name, role } = payload;
      if (!email || !full_name || !role) {
        return json({ error: "email, full_name, role required" }, 400);
      }

      const normalizedEmail = String(email).toLowerCase().trim();
      const redirectTo = `${SITE_URL}/auth/set-password`;

      // 7.1) Hubi invite hore u jiro
      const { data: existingInvite } = await supabaseAdmin
        .from("invites")
        .select("id,status")
        .eq("email", normalizedEmail)
        .maybeSingle();

      // 7.2) Haddii hore u jiro -> resend invite + update record
      if (existingInvite?.id) {
        const { error: resendErr } =
          await supabaseAdmin.auth.admin.inviteUserByEmail(normalizedEmail, {
            redirectTo,
            data: { full_name, role },
          });
        if (resendErr) return json({ error: resendErr.message }, 500);

        await supabaseAdmin
          .from("invites")
          .update({ status: "pending", full_name, role })
          .eq("id", existingInvite.id);

        return json({ success: true, message: "Invite resent" }, 200);
      }

      // 7.3) Invite cusub
      const { data: inviteData, error: inviteErr } =
        await supabaseAdmin.auth.admin.inviteUserByEmail(normalizedEmail, {
          redirectTo,
          data: { full_name, role },
        });

      if (inviteErr) return json({ error: inviteErr.message }, 500);

      // 7.4) Kaydi invite DB (pending)
      const { error: dbErr } = await supabaseAdmin.from("invites").insert({
        email: normalizedEmail,
        full_name,
        role,
        status: "pending",
      });
      if (dbErr) return json({ error: dbErr.message }, 500);

      return json({ success: true, user_id: inviteData.user.id }, 200);
    }

    /* =========================================================
       8) ACTION: activate (USER auto activate after login)
       - user waa inuu login yahay (Bearer token)
       - pending invite -> active
       - profiles + user_roles upsert
       - idempotent: marar badan hadduu waco dhib maleh
    ========================================================= */
    if (action === "activate") {
      if (!callerId || !callerEmail) {
        return json({ error: "Must be authenticated" }, 401);
      }

      const normalizedEmail = callerEmail.toLowerCase().trim();

      // 8.1) Hel invite by email
      const { data: invite } = await supabaseAdmin
        .from("invites")
        .select("*")
        .eq("email", normalizedEmail)
        .maybeSingle();

      // Haddii invite uusan jirin, haddana return success (si login uusan u burburin)
      if (!invite) {
        return json({ success: true, message: "No invite found (skip)" }, 200);
      }

      // 8.2) Samee/Update profile
      const { error: profErr } = await supabaseAdmin.from("profiles").upsert(
        {
          user_id: callerId,
          name: invite.full_name,
          email: normalizedEmail,
          is_active: true,
        },
        { onConflict: "user_id" },
      );
      if (profErr) return json({ error: profErr.message }, 500);

      // 8.3) Samee/Update role
      const { error: roleErr } = await supabaseAdmin.from("user_roles").upsert(
        { user_id: callerId, role: invite.role },
        { onConflict: "user_id,role" },
      );
      if (roleErr) return json({ error: roleErr.message }, 500);

      // 8.4) invites -> active (pending ka saar)
      const { error: invErr } = await supabaseAdmin
        .from("invites")
        .update({ status: "active" })
        .eq("id", invite.id);

      if (invErr) return json({ error: invErr.message }, 500);

      return json({ success: true, message: "Activated" }, 200);
    }

    /* =========================================================
       9) ACTION: list (ADMIN: active + pending)
       - UI admin wuxuu arkaa labadaba
    ========================================================= */
    if (action === "list") {
      if (!(await isAdmin())) return json({ error: "Admin only" }, 403);

      const { data: activeUsers, error: activeErr } = await supabaseAdmin
        .from("profiles")
        .select("user_id,name,email,is_active,created_at, user_roles(role)")
        .order("created_at", { ascending: false });

      if (activeErr) return json({ error: activeErr.message }, 500);

      const { data: pendingInvites, error: pendingErr } = await supabaseAdmin
        .from("invites")
        .select("id,email,full_name,role,status,created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (pendingErr) return json({ error: pendingErr.message }, 500);

      return json(
        {
          activeUsers: activeUsers ?? [],
          pendingInvites: pendingInvites ?? [],
        },
        200,
      );
    }

    /* =========================================================
       10) ACTION: list_pending (ADMIN: pending invites only)
    ========================================================= */
    if (action === "list_pending") {
      if (!(await isAdmin())) return json({ error: "Admin only" }, 403);

      const { data, error } = await supabaseAdmin
        .from("invites")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) return json({ error: error.message }, 500);
      return json({ invites: data ?? [] }, 200);
    }

    /* =========================================================
       11) ACTION: update_role (ADMIN)
       - user hal role oo keliya ha yeesho (delete others)
    ========================================================= */
    if (action === "update_role") {
      if (!(await isAdmin())) return json({ error: "Admin only" }, 403);

      const { userId: targetId, role: newRole } = payload;
      if (!targetId || !newRole) return json({ error: "userId and role required" }, 400);

      const { error: upErr } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: targetId, role: newRole }, { onConflict: "user_id,role" });

      if (upErr) return json({ error: upErr.message }, 500);

      const { error: delErr } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", targetId)
        .neq("role", newRole);

      if (delErr) return json({ error: delErr.message }, 500);

      return json({ success: true }, 200);
    }

    /* =========================================================
       12) ACTION: deactivate (ADMIN)
       - profiles.is_active = false
    ========================================================= */
    if (action === "deactivate") {
      if (!(await isAdmin())) return json({ error: "Admin only" }, 403);

      const { userId: targetId } = payload;
      if (!targetId) return json({ error: "userId required" }, 400);

      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ is_active: false })
        .eq("user_id", targetId);

      if (error) return json({ error: error.message }, 500);
      return json({ success: true }, 200);
    }

    /* =========================================================
       13) ACTION: delete (ADMIN)
       - delete auth user + cleanup profiles/user_roles
    ========================================================= */
    if (action === "delete") {
      if (!(await isAdmin())) return json({ error: "Admin only" }, 403);

      const { userId: targetId } = payload;
      if (!targetId) return json({ error: "userId required" }, 400);

      const { error: delAuthErr } = await supabaseAdmin.auth.admin.deleteUser(targetId);
      if (delAuthErr) return json({ error: delAuthErr.message }, 500);

      await supabaseAdmin.from("user_roles").delete().eq("user_id", targetId);
      await supabaseAdmin.from("profiles").delete().eq("user_id", targetId);

      return json({ success: true }, 200);
    }

    /* =========================================================
       14) ACTION: resend_invite (ADMIN)
       - resend by email (no listUsers pagination issue)
    ========================================================= */
    if (action === "resend_invite") {
      if (!(await isAdmin())) return json({ error: "Admin only" }, 403);

      const { email, full_name, role } = payload;
      if (!email) return json({ error: "email required" }, 400);

      const normalizedEmail = String(email).toLowerCase().trim();
      const redirectTo = `${SITE_URL}/auth/set-password`;

      const { error: resendErr } =
        await supabaseAdmin.auth.admin.inviteUserByEmail(normalizedEmail, {
          redirectTo,
          data: { full_name: full_name ?? null, role: role ?? null },
        });

      if (resendErr) return json({ error: resendErr.message }, 500);

      await supabaseAdmin.from("invites").upsert(
        {
          email: normalizedEmail,
          full_name: full_name ?? "",
          role: role ?? "user",
          status: "pending",
        },
        { onConflict: "email" },
      );

      return json({ success: true }, 200);
    }

    /* =========================================================
       15) ACTION: create_direct (bootstrap user/admin with password)
       - allowed haddii admin uusan jirin (first setup)
       - haddii admin jiro -> admin only
    ========================================================= */
    if (action === "create_direct") {
      const { email, password, full_name, role } = payload;
      if (!email || !password || !full_name || !role) {
        return json({ error: "email, password, full_name, role required" }, 400);
      }

      const hasAdmin = await adminExists();
      if (hasAdmin) {
        if (!(await isAdmin())) return json({ error: "Admin only" }, 403);
      }

      const normalizedEmail = String(email).toLowerCase().trim();

      const { data: userData, error: createErr } =
        await supabaseAdmin.auth.admin.createUser({
          email: normalizedEmail,
          password,
          email_confirm: true,
          user_metadata: { full_name, role },
        });

      if (createErr) return json({ error: createErr.message }, 500);

      const uid = userData.user.id;

      await supabaseAdmin.from("profiles").upsert(
        { user_id: uid, name: full_name, email: normalizedEmail, is_active: true },
        { onConflict: "user_id" },
      );

      await supabaseAdmin.from("user_roles").upsert(
        { user_id: uid, role },
        { onConflict: "user_id,role" },
      );

      return json({ success: true, user_id: uid }, 200);
    }

    // ---------- action aan la aqoon ----------
    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
