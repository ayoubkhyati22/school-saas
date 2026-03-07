import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Admin client with service role key — bypasses RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    // Verify the caller is an authenticated school_admin
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single();

    if (callerProfile?.role !== 'school_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { full_name, email, phone_number, role, school_id, username } = body;

    if (!full_name || !email || !role || !school_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Ensure the admin is only creating users for their own school
    if (school_id !== callerProfile.school_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create auth user (auto-confirmed, temporary password)
    const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const newUserId = authData.user.id;

    // Insert profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUserId,
        full_name,
        email,
        phone_number: phone_number || null,
        role,
        school_id,
        username: username || email.split('@')[0],
      })
      .select()
      .single();

    if (profileError) {
      // Rollback: delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({ profile });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single();

    if (callerProfile?.role !== 'school_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    // Verify target belongs to same school
    const { data: target } = await supabaseAdmin
      .from('profiles')
      .select('school_id')
      .eq('id', userId)
      .single();

    if (target?.school_id !== callerProfile.school_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete profile first (FK constraint), then auth user
    await supabaseAdmin.from('profiles').delete().eq('id', userId);
    await supabaseAdmin.auth.admin.deleteUser(userId);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
