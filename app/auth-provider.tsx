"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  AuthChangeEvent,
  Session,
  User,
} from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
};

const AuthContext =
  createContext<AuthContextValue>({
    user: null,
    session: null,
    loading: true,
  });

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] =
    useState<Session | null>(null);

  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let mounted = true;

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (
          event: AuthChangeEvent,
          nextSession: Session | null
        ) => {
          if (!mounted) {
            return;
          }

          console.log(
            "GLOBAL AUTH EVENT:",
            event,
            !!nextSession
          );

          if (nextSession) {
            setSession(
              nextSession
            );

            setUser(
              nextSession.user
            );
          } else {
            setSession(null);
            setUser(null);
          }

          setLoading(false);
        }
      );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value =
    useMemo<AuthContextValue>(
      () => ({
        user,
        session,
        loading,
      }),
      [
        user,
        session,
        loading,
      ]
    );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(
    AuthContext
  );
}