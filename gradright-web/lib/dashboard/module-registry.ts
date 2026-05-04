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
      { href: "/explore", label: "Discover feed" },
      { href: "/career", label: "Career exploration" },
      { href: "/explore/articles/country-guides-overview", label: "Country guides" },
      { href: "/career/navigator", label: "University explorer" },
      { href: "/explore/articles/admissions-explained", label: "Admission guidance" },
      { href: "/explore/articles/sop-lor-playbook", label: "SOP / LOR" },
      { href: "/explore/articles/scholarship-strategy-starter", label: "Scholarships" },
      { href: "/explore/articles/requirements-by-goal", label: "Requirements" },
      { href: "/explore/articles/financial-literacy-abroad", label: "Financial literacy" },
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
      { href: "/plan/admission", label: "Admission predictor" },
      { href: "/career", label: "Job outlook (3 / 6 / 12 mo)" },
      { href: "/funding#roi", label: "ROI lens" },
      { href: "/plan/timeline", label: "Timeline & deadlines" },
      { href: "/plan/timeline", label: "Application checklist" },
      { href: "/career/navigator", label: "Skill roadmap" },
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
      { href: "/funding#cost-planner", label: "Cost planner" },
      { href: "/funding#living", label: "Living expenses" },
      { href: "/explore/articles/scholarship-strategy-starter", label: "Scholarship strategy" },
      { href: "/funding#readiness", label: "Funding readiness" },
      { href: "/funding#smart-financing", label: "Smart financing" },
      { href: "/funding#emi", label: "EMI understanding" },
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
      { href: "/connect#mentor", label: "AI mentor" },
      { href: "/connect#community", label: "Community" },
      { href: "/connect#peers", label: "Peer groups" },
      { href: "/connect#alerts", label: "Notifications" },
      { href: "/dashboard/score-upgrade", label: "Profile deepening" },
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
