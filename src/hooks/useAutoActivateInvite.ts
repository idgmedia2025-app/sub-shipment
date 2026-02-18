import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAutoActivateInvite() {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          const email = session.user.email;
          if (!email) return;

          // Check if there's a pending invite for this email
          const { data: invite } = await supabase
            .from("invites")
            .select("id, status")
            .eq("email", email)
            .eq("status", "pending")
            .maybeSingle();

          if (invite) {
            // Activate the invite
            await supabase
              .from("invites")
              .update({ status: "active" })
              .eq("id", invite.id);
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);
}
