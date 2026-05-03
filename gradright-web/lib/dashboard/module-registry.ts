import type { JourneyStage } from "@/lib/types";

/** Deep links into product modules (used by journey bar, CTAs). */
export const MODULE_ROUTES = {
  discover: "/discover",
  plan: "/plan",
  finance: "/finance",
  apply: "/apply",
  succeed: "/succeed",
} as const satisfies Record<JourneyStage, string>;

export type HubNavIconKey =
  (typeof HUB_STUDENT_NAV)[number]["icon"];

/** Single source of truth for authenticated hub navigation. */
export const HUB_STUDENT_NAV = [
  {
    id: "home" as const,
    href: "/dashboard",
    label: "Home",
    title: "Dashboard",
    icon: "layout" as const,
    journeyStage: null,
    authRequired: true,
    showInSidebar: true,
  },
  {
    id: "career" as const,
    href: "/career",
    label: "Career",
    title: "Career outlook",
    icon: "target" as const,
    journeyStage: null,
    authRequired: true,
    showInSidebar: true,
  },
  {
    id: "discover" as const,
    href: MODULE_ROUTES.discover,
    label: "Discover",
    title: "Discover programs",
    icon: "compass" as const,
    journeyStage: "discover" as const,
    authRequired: true,
    showInSidebar: true,
  },
  {
    id: "plan" as const,
    href: MODULE_ROUTES.plan,
    label: "Plan",
    title: "Plan admissions",
    icon: "map" as const,
    journeyStage: "plan" as const,
    authRequired: true,
    showInSidebar: true,
  },
  {
    id: "finance" as const,
    href: MODULE_ROUTES.finance,
    label: "Finance",
    title: "Finance & loans",
    icon: "wallet" as const,
    journeyStage: "finance" as const,
    authRequired: true,
    showInSidebar: true,
  },
  {
    id: "apply" as const,
    href: MODULE_ROUTES.apply,
    label: "Apply",
    title: "Loan application",
    icon: "file" as const,
    journeyStage: "apply" as const,
    authRequired: true,
    showInSidebar: true,
  },
  {
    id: "succeed" as const,
    href: MODULE_ROUTES.succeed,
    label: "Succeed",
    title: "After admit",
    icon: "rocket" as const,
    journeyStage: "succeed" as const,
    authRequired: true,
    showInSidebar: true,
  },
] as const;

/** Shape consumed by `DashboardShell` (icon resolved client-side). */
export const DASHBOARD_NAV = HUB_STUDENT_NAV.filter((n) => n.showInSidebar).map(
  (n) => ({
    href: n.href,
    label: n.label,
    icon: n.icon,
  })
);
