import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL");
const FROM_NAME = Deno.env.get("RESEND_FROM_NAME") || "Fabuos Creators";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OTPEmailRequest {
  email: string;
  otp: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, otp }: OTPEmailRequest = await req.json();

    if (!email || !otp) {
      throw new Error("Email and OTP are required");
    }

    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [email],
      subject: "Your Verification Code",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verification Code</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8f9fa;">
            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8f9fa;">
              <tr>
                <td style="padding: 40px 20px;">
                  <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Fabuos Creators</h1>
                        <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">AI Content Studio</p>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <h2 style="margin: 0 0 16px; color: #1a1a1a; font-size: 24px; font-weight: 600;">Your Verification Code</h2>
                        <p style="margin: 0 0 24px; color: #6b7280; font-size: 16px; line-height: 1.6;">
                          Use this code to complete your sign-in. This code will expire in <strong>10 minutes</strong>.
                        </p>
                        
                        <!-- OTP Code Box -->
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 24px; text-align: center; margin: 32px 0;">
                          <div style="background-color: rgba(255, 255, 255, 0.15); border-radius: 8px; padding: 20px; backdrop-filter: blur(10px);">
                            <p style="margin: 0 0 8px; color: rgba(255, 255, 255, 0.8); font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Verification Code</p>
                            <p style="margin: 0; color: #ffffff; font-size: 42px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</p>
                          </div>
                        </div>
                        
                        <p style="margin: 24px 0 0; color: #9ca3af; font-size: 14px; line-height: 1.6;">
                          If you didn't request this code, you can safely ignore this email. Someone may have accidentally entered your email address.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 32px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center; line-height: 1.5;">
                          © 2025 Fabuos Creators. All rights reserved.<br>
                          This is an automated message, please do not reply.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend error while sending OTP:", error);
      throw new Error(error.message || "Failed to send verification email");
    }

    console.log("OTP email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, id: data?.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-otp-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
