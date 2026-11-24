import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

/** UI hint only — the database enforces who can approve listings. */
export function useIsAdmin() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["me", "isAdmin", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "admin")
        .maybeSingle();
      return Boolean(data);
    },
    staleTime: 5 * 60_000,
  });
  return Boolean(user) && data === true;
}
