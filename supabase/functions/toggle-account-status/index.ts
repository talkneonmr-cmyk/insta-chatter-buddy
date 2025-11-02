import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ToggleAccountRequest {
  userId: string;
  action: 'disable' | 'enable';
  duration?: string; // e.g., '24h', '7d', 'permanent'
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requestingUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !requestingUser) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      throw new Error('Admin privileges required');
    }

    const { userId, action, duration = 'permanent' }: ToggleAccountRequest = await req.json();

    if (!userId || !action) {
      throw new Error('Missing required fields: userId and action');
    }

    // Prevent admin from disabling their own account
    if (userId === requestingUser.id) {
      throw new Error('Cannot disable your own account');
    }

    let updateData: any = {};

    if (action === 'disable') {
      // Calculate ban until date
      let bannedUntil: string;
      if (duration === 'permanent') {
        // Set to year 9999 for permanent ban
        bannedUntil = '9999-12-31T23:59:59.999Z';
      } else {
        // Parse duration like '24h', '7d'
        const now = new Date();
        const match = duration.match(/^(\d+)([hd])$/);
        if (match) {
          const value = parseInt(match[1]);
          const unit = match[2];
          if (unit === 'h') {
            now.setHours(now.getHours() + value);
          } else if (unit === 'd') {
            now.setDate(now.getDate() + value);
          }
        }
        bannedUntil = now.toISOString();
      }

      // Update user to disable account with ban
      updateData = {
        ban_duration: bannedUntil,
        user_metadata: {
          account_disabled: true,
          disabled_at: new Date().toISOString(),
          disabled_by: requestingUser.id,
        },
      };
    } else {
      // Enable account by removing ban
      updateData = {
        ban_duration: 'none',
        user_metadata: {
          account_disabled: false,
          enabled_at: new Date().toISOString(),
          enabled_by: requestingUser.id,
        },
      };
    }

    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      updateData
    );

    if (updateError) {
      console.error('Error updating user:', updateError);
      throw updateError;
    }

    // Log the action
    await supabase.from('user_activity_logs').insert({
      user_id: requestingUser.id,
      user_email: requestingUser.email,
      action: action === 'disable' ? 'account_disabled' : 'account_enabled',
      details: {
        target_user_id: userId,
        duration: duration,
      },
    });

    console.log(`Account ${action}d successfully for user:`, userId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Account ${action}d successfully`,
        user: updatedUser,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in toggle-account-status:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.message === 'Unauthorized' || error.message === 'Admin privileges required' ? 403 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
