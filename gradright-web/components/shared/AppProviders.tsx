"use client";

import { createBrowserClient } from "@supabase/ssr";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getPublicEnv } from "@/lib/config/env";

const SupabaseContext = createContext<SupabaseClient | null>(null);

function SupabaseSessionProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => {
    const env = getPublicEnv();
    return createBrowserClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }, []);

  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase(): SupabaseClient {
  const client = useContext(SupabaseContext);
  if (!client) {
    throw new Error("useSupabase must be used within SupabaseSessionProvider");
  }
  return client;
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseSessionProvider>{children}</SupabaseSessionProvider>
    </QueryClientProvider>
  );
}
