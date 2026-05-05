import type { JourneyStage } from "@/lib/types";

/** Deep links into product modules (used by journey bar, CTAs, journey_stage). */
export const MODULE_ROUTES = {
  discover: "/explore",
  plan: "/plan",
  finance: "/funding",
  apply: "/apply",
  succeed: "/succeed",
} as const satisfies Record<JourneyStage, string>;

export type HubSidebarIconId =
  | "layout"
  | "compass"
  | "map"
  | "wallet"
  | "users";

export type HubSidebarChild = {
  readonly href: string;
  readonly label: string;
  /** Menu ↔ `/api/features/*` contract (same profile_hub slice as GET /api/profile-hub). */
  readonly featureApi?: string;
};

export type HubSidebarSection = {
  readonly id: "home" | "explore" | "plan" | "funding" | "connect";
  readonly href: string;
  readonly label: string;
  readonly title: string;
  readonly emotion: string;
  readonly icon: HubSidebarIconId;
  /** Path prefixes that keep this section highlighted (first match wins in UI). */
  readonly activePrefixes: readonly string[];
  /** Primary feature bundle for this section (when no nested children). */
  readonly featureApi?: string;
  readonly children: readonly HubSidebarChild[];
};

/** Journey-first hub IA: five primaries, nested destinations only when expanded. */
export const HUB_SIDEBAR_SECTIONS: readonly HubSidebarSection[] = [
  {
    id: "home",
    href: "/dashboard",
    label: "Home",
    title: "Student command center",
    emotion: "Where am I?",
    icon: "layout",
    activePrefixes: ["/dashboard"],
    featureApi: "/api/features/home",
    children: [],
  },
  {
    id: "explore",
    href: "/explore",
    label: "Explore",
    title: "Awareness & discovery",
    emotion: "What’s possible?",
    icon: "compass",
    activePrefixes: ["/explore", "/career"],
    children: [
      { href: "/explore", label: "Discover feed", featureApi: "/api/features/discover" },
      { href: "/career", label: "Career exploration", featureApi: "/api/features/career" },
      {
        href: "/explore/articles/country-guides-overview",
        label: "Country guides",
        featureApi: "/api/features/countries",
      },
      {
        href: "/career/navigator",
        label: "University explorer",
        featureApi: "/api/features/universities",
      },
      {
        href: "/explore/articles/admissions-explained",
        label: "Admission guidance",
        featureApi: "/api/features/admission-guide",
      },
      {
        href: "/explore/articles/sop-lor-playbook",
        label: "SOP / LOR",
        featureApi: "/api/features/admission-guide",
      },
      {
        href: "/explore/articles/scholarship-strategy-starter",
        label: "Scholarships",
        featureApi: "/api/features/scholarships",
      },
      {
        href: "/explore/articles/requirements-by-goal",
        label: "Requirements",
        featureApi: "/api/features/requirements",
      },
      {
        href: "/explore/articles/financial-literacy-abroad",
        label: "Financial literacy",
        featureApi: "/api/features/financial-literacy",
      },
    ],
  },
  {
    id: "plan",
    href: "/plan",
    label: "Plan",
    title: "Preparation & prediction",
    emotion: "What should I do?",
    icon: "map",
    activePrefixes: ["/plan"],
    children: [
      {
        href: "/plan/admission",
        label: "Admission predictor",
        featureApi: "/api/features/admission-predictor",
      },
      {
        href: "/career",
        label: "Job outlook (3 / 6 / 12 mo)",
        featureApi: "/api/features/job-outlook",
      },
      { href: "/funding#roi", label: "ROI lens", featureApi: "/api/features/roi" },
      {
        href: "/plan/timeline",
        label: "Timeline & deadlines",
        featureApi: "/api/features/timeline",
      },
      {
        href: "/plan/timeline",
        label: "Application checklist",
        featureApi: "/api/features/checklist",
      },
      {
        href: "/career/navigator",
        label: "Skill roadmap",
        featureApi: "/api/features/skill-roadmap",
      },
      { href: "/plan/gre", label: "GRE estimator", featureApi: "/api/features/gre" },
    ],
  },
  {
    id: "funding",
    href: "/funding",
    label: "Funding",
    title: "Financial confidence",
    emotion: "How can I do this safely?",
    icon: "wallet",
    activePrefixes: ["/funding", "/finance"],
    children: [
      {
        href: "/funding#cost-planner",
        label: "Cost planner",
        featureApi: "/api/features/cost-planner",
      },
      {
        href: "/funding#living",
        label: "Living expenses",
        featureApi: "/api/features/living-expenses",
      },
      {
        href: "/explore/articles/scholarship-strategy-starter",
        label: "Scholarship strategy",
        featureApi: "/api/features/scholarship-strategy",
      },
      {
        href: "/funding#readiness",
        label: "Funding readiness",
        featureApi: "/api/features/funding-readiness",
      },
      {
        href: "/funding#smart-financing",
        label: "Smart financing",
        featureApi: "/api/features/financial-literacy",
      },
      {
        href: "/funding#emi",
        label: "EMI understanding",
        featureApi: "/api/features/financial-literacy",
      },
      { href: "/apply", label: "Secure funding (when ready)" },
    ],
  },
  {
    id: "connect",
    href: "/connect",
    label: "Connect",
    title: "Mentor & community",
    emotion: "Who helps me improve?",
    icon: "users",
    activePrefixes: ["/connect"],
    children: [
      { href: "/connect#mentor", label: "AI mentor", featureApi: "/api/features/mentor" },
      { href: "/connect#community", label: "Community", featureApi: "/api/features/community" },
      { href: "/connect#peers", label: "Peer groups", featureApi: "/api/features/peers" },
      {
        href: "/connect#alerts",
        label: "Notifications",
        featureApi: "/api/features/notifications",
      },
      {
        href: "/dashboard/score-upgrade",
        label: "Profile deepening",
        featureApi: "/api/features/profile-deepening",
      },
    ],
  },
] as const;

/** Mobile bottom bar: same five primaries, no nested clutter. */
export const HUB_MOBILE_PRIMARY = HUB_SIDEBAR_SECTIONS.map((s) => ({
  id: s.id,
  href: s.href,
  label: s.label,
  icon: s.icon,
}));

export function hubSectionIsActive(
  section: HubSidebarSection,
  pathname: string
): boolean {
  return section.activePrefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}
