-- Drop and recreate get_all_users_admin function with additional fields
DROP FUNCTION IF EXISTS public.get_all_users_admin();

CREATE OR REPLACE FUNCTION public.get_all_users_admin()
RETURNS TABLE(
  id uuid, 
  email text, 
  created_at timestamp with time zone, 
  last_sign_in_at timestamp with time zone, 
  email_confirmed_at timestamp with time zone,
  confirmed_at timestamp with time zone,
  banned_until timestamp with time zone,
  raw_user_meta_data jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user is admin
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Return all users from auth schema with additional fields
  RETURN QUERY
  SELECT 
    au.id,
    au.email::text,
    au.created_at,
    au.last_sign_in_at,
    au.email_confirmed_at,
    au.confirmed_at,
    au.banned_until,
    au.raw_user_meta_data
  FROM auth.users au
  ORDER BY au.created_at DESC;
END;
$function$;