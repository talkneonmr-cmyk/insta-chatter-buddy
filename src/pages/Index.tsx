import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Dashboard from "@/components/Dashboard";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Handle Instagram OAuth callback
    const handleInstagramCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');

      if (code && state) {
        console.log('Instagram OAuth callback received');
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (!session) {
            toast.error('Please sign in first');
            navigate('/auth');
            return;
          }

          const { data, error } = await supabase.functions.invoke('instagram-oauth', {
            body: { code, state },
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });

          if (error) throw error;

          if (data?.success) {
            toast.success(`Instagram account @${data.username} connected successfully!`);
            // Clean up URL
            window.history.replaceState({}, document.title, '/');
          }
        } catch (error) {
          console.error('Instagram OAuth error:', error);
          toast.error('Failed to connect Instagram account');
          // Clean up URL
          window.history.replaceState({}, document.title, '/');
        }
      }
    };

    handleInstagramCallback();
  }, [navigate]);

  return <Dashboard />;
};

export default Index;
