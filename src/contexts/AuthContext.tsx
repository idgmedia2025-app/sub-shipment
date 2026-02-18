import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin" | "moderator" | "user";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  profile: { id: string; name: string; email: string; customer_id: string | null } | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isStaff: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    try {
      const [roleRes, profileRes] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
        supabase.from("profiles").select("id, name, email, customer_id").eq("user_id", userId).maybeSingle(),
      ]);
      if (roleRes.data) setRole(roleRes.data.role);
      if (profileRes.data) setProfile(profileRes.data);
    } catch {
      // silent
    }
  };

  // Auto-activate invited users on SIGNED_IN (merged here to avoid duplicate subscriptions)
  const autoActivateInvite = async (email: string) => {
    const { data: invite } = await supabase
      .from("invites")
      .select("id, status")
      .eq("email", email)
      .eq("status", "pending")
      .maybeSingle();
    if (invite) {
      await supabase.from("invites").update({ status: "active" }).eq("id", invite.id);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Auto-activate pending invite on first sign-in
        if (event === "SIGNED_IN" && session.user.email) {
          await autoActivateInvite(session.user.email);
        }
        await fetchUserData(session.user.id);
      } else {
        setRole(null);
        setProfile(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) await fetchUserData(session.user.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    // Clear all state immediately
    setRole(null);
    setProfile(null);
    setSession(null);
    setUser(null);
    
    // Sign out from Supabase (clears session + cookies)
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      session, user, role, profile, loading, signIn, signOut,
      isStaff: role === "admin" || role === "moderator",
      isAdmin: role === "admin",
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be within AuthProvider");
  return ctx;
}
