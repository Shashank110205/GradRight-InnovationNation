"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from "react";

import type { StudentIntelligence } from "@/lib/profile/student-intelligence";
import type { StudentProfile } from "@/lib/types";

const STORAGE_PREFIX = "gr-dash-nav-v1-";

export type DashboardNavSnapshot = {
  userId: string;
  target_country: string | null;
  broad_field: string | null;
  career_direction: string;
  profile_summary_snip: string;
  updatedAt: number;
};

type DashboardNavDataContextValue = {
  publish: (
    userId: string,
    profile: StudentProfile | null,
    intelligence: StudentIntelligence
  ) => void;
  peek: (userId: string) => DashboardNavSnapshot | null;
};

const DashboardNavDataContext = createContext<DashboardNavDataContextValue | null>(
  null
);

export function DashboardNavDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const memoryRef = useRef<DashboardNavSnapshot | null>(null);

  const publish = useCallback(
    (
      userId: string,
      profile: StudentProfile | null,
      intelligence: StudentIntelligence
    ) => {
      const snap: DashboardNavSnapshot = {
        userId,
        target_country: profile?.target_country ?? null,
        broad_field: profile?.broad_field ?? null,
        career_direction: intelligence.career_direction,
        profile_summary_snip: intelligence.profile_summary.slice(0, 280),
        updatedAt: Date.now(),
      };
      memoryRef.current = snap;
      try {
        sessionStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(snap));
      } catch {
        /* quota / private mode */
      }
    },
    []
  );

  const peek = useCallback((userId: string): DashboardNavSnapshot | null => {
    if (memoryRef.current?.userId === userId) {
      return memoryRef.current;
    }
    try {
      const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${userId}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as DashboardNavSnapshot;
      if (parsed.userId !== userId) return null;
      memoryRef.current = parsed;
      return parsed;
    } catch {
      return null;
    }
  }, []);

  const value = useMemo(
    () => ({
      publish,
      peek,
    }),
    [publish, peek]
  );

  return (
    <DashboardNavDataContext.Provider value={value}>
      {children}
    </DashboardNavDataContext.Provider>
  );
}

export function useDashboardNavData(): DashboardNavDataContextValue | null {
  return useContext(DashboardNavDataContext);
}
