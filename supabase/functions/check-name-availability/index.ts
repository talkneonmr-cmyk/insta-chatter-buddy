import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name } = await req.json();

    if (!name || typeof name !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean the name - remove spaces and special characters for URL/handle
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (cleanName.length < 3) {
      return new Response(
        JSON.stringify({ error: 'Name must be at least 3 characters (letters/numbers only)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Checking availability for: ${cleanName}`);

    // Check YouTube channel availability
    let youtubeAvailable = false;
    let youtubeError = null;
    
    try {
      const ytResponse = await fetch(`https://www.youtube.com/@${cleanName}`, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      // If 404, the channel doesn't exist (available)
      // If 200, the channel exists (not available)
      youtubeAvailable = ytResponse.status === 404;
      console.log(`YouTube @${cleanName}: status ${ytResponse.status}, available: ${youtubeAvailable}`);
    } catch (err) {
      console.error('YouTube check error:', err);
      youtubeError = 'Could not check YouTube';
    }

    // Check domain availability using DNS lookup
    let domainAvailable = false;
    let domainError = null;
    const domainName = `${cleanName}.com`;
    
    try {
      // Try to resolve the domain - if it fails, domain might be available
      const dnsResponse = await fetch(`https://dns.google/resolve?name=${domainName}&type=A`);
      const dnsData = await dnsResponse.json();
      
      // If no Answer array or empty, domain might be available
      // Status 3 (NXDOMAIN) means domain doesn't exist
      if (dnsData.Status === 3 || !dnsData.Answer || dnsData.Answer.length === 0) {
        // Double check with a HEAD request to the domain
        try {
          const domainResponse = await fetch(`https://${domainName}`, {
            method: 'HEAD',
            signal: AbortSignal.timeout(5000)
          });
          domainAvailable = false; // Domain responds, so it's taken
        } catch {
          // Domain doesn't respond, likely available
          domainAvailable = true;
        }
      } else {
        domainAvailable = false;
      }
      
      console.log(`Domain ${domainName}: available: ${domainAvailable}`);
    } catch (err) {
      console.error('Domain check error:', err);
      domainError = 'Could not check domain';
    }

    const bothAvailable = youtubeAvailable && domainAvailable && !youtubeError && !domainError;

    return new Response(
      JSON.stringify({
        success: true,
        name: cleanName,
        youtube: {
          handle: `@${cleanName}`,
          available: youtubeAvailable,
          error: youtubeError,
        },
        domain: {
          name: domainName,
          available: domainAvailable,
          error: domainError,
        },
        bothAvailable,
        recommendation: bothAvailable 
          ? `Great news! Both @${cleanName} on YouTube and ${domainName} appear to be available!`
          : youtubeAvailable && !domainAvailable
            ? `@${cleanName} is available on YouTube, but ${domainName} is taken.`
            : !youtubeAvailable && domainAvailable
              ? `${domainName} appears available, but @${cleanName} is taken on YouTube.`
              : `Both @${cleanName} and ${domainName} appear to be taken.`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in check-name-availability:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
