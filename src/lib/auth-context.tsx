"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { User } from "@supabase/supabase-js";

type Role = "hq" | "sv" | "owner" | null;

type AuthContextType = {
  user: User | null;
  role: Role;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setRole((user?.app_metadata?.role as Role) || (user?.user_metadata?.role as Role) || null);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setRole((currentUser?.app_metadata?.role as Role) || (currentUser?.user_metadata?.role as Role) || null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut }}>
      {children}
      {user && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 9999,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-50%",
              left: "-50%",
              width: "200%",
              height: "200%",
              transform: "rotate(-25deg)",
              display: "flex",
              flexWrap: "wrap",
              gap: "80px",
              alignContent: "flex-start",
              padding: "40px",
            }}
          >
            {Array.from({ length: 60 }).map((_, i) => (
              <span
                key={i}
                style={{
                  fontSize: "13px",
                  color: "rgba(0,0,0,0.04)",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  userSelect: "none",
                }}
              >
                {user.email} · {new Date().toLocaleDateString("ko-KR")}
              </span>
            ))}
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function canEdit(role: Role): boolean {
  return role === "hq";
}
