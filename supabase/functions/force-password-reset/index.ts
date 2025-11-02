import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ForcePasswordResetRequest {
  userId: string;
  userEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

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

    let requestBody;
    try {
      requestBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { userId, userEmail }: ForcePasswordResetRequest = requestBody;

    if (!userId || !userEmail) {
      throw new Error('Missing required fields: userId and userEmail');
    }

    // Update user metadata to flag forced password reset
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      {
        user_metadata: {
          force_password_change: true,
          force_password_change_at: new Date().toISOString(),
          force_password_change_by: requestingUser.id,
        },
      }
    );

    if (updateError) {
      console.error('Error updating user metadata:', updateError);
      throw updateError;
    }

    // Generate password reset link
    const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: userEmail,
    });

    if (resetError || !resetData) {
      console.error('Error generating reset link:', resetError);
      throw new Error('Failed to generate password reset link');
    }

    // Send password reset email if Resend is configured
    if (resend && resetData.properties?.action_link) {
      const resendFromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev';
      const resendFromName = Deno.env.get('RESEND_FROM_NAME') || 'Admin';

      try {
        await resend.emails.send({
          from: `${resendFromName} <${resendFromEmail}>`,
          to: [userEmail],
          subject: 'Password Reset Required',
          html: `
            <h1>Password Reset Required</h1>
            <p>Your administrator has required you to reset your password.</p>
            <p>Please click the link below to create a new password:</p>
            <a href="${resetData.properties.action_link}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">Reset Password</a>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p>${resetData.properties.action_link}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't request this, please contact your administrator immediately.</p>
          `,
        });
        console.log('Password reset email sent to:', userEmail);
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Don't fail the whole operation if email fails
      }
    }

    // Log the action
    await supabase.from('user_activity_logs').insert({
      user_id: requestingUser.id,
      user_email: requestingUser.email,
      action: 'force_password_reset',
      details: {
        target_user_id: userId,
        target_user_email: userEmail,
      },
    });

    console.log('Force password reset initiated for user:', userId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Password reset required successfully',
        resetLink: resetData.properties?.action_link,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in force-password-reset:', error);
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
