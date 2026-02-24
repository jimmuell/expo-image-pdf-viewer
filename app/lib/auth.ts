import { useState, useEffect } from "react";
import { type Session } from "@supabase/supabase-js";
import { supabase } from "@/app/lib/supabase";

export function useSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        // Stale / revoked token (e.g. local Supabase restarted) — clear it.
        supabase.auth.signOut();
        setSession(null);
        return;
      }
      setSession(data.session ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);
  return { session, loading: session === undefined };
}

export type Profile = {
  role: "client" | "attorney" | "admin";
  full_name: string | null;
};

export function useProfile(): Profile | null {
  const { session } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  useEffect(() => {
    if (!session) {
      setProfile(null);
      return;
    }
    supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", session.user.id)
      .single()
      .then(({ data }) => setProfile(data as Profile | null));
  }, [session]);
  return profile;
}
