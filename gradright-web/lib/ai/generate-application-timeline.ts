const DEFAULT_MODEL = "claude-3-5-haiku-20241022";

export type TimelinePhaseColor = "blue" | "amber" | "green" | "red";
export type MilestonePriority = "high" | "medium" | "low";

export type ApplicationTimelineMilestone = {
  week: number;
  date: string;
  task: string;
  priority: MilestonePriority;
  daysFromNow: number;
  isOverdue: boolean;
};

export type ApplicationTimelinePhase = {
  phaseName: string;
  startWeek: number;
  endWeek: number;
  color: TimelinePhaseColor;
  milestones: ApplicationTimelineMilestone[];
};

export type ApplicationTimelineDeadline = {
  task: string;
  date: string;
  daysLeft: number;
};

export type ApplicationTimelinePayload = {
  totalWeeks: number;
  intakeDate: string;
  phases: ApplicationTimelinePhase[];
  upcomingDeadlines: ApplicationTimelineDeadline[];
  aiTip: string;
};

export type ApplicationTimelineInput = {
  targetIntake: string;
  targetCountry: string;
  targetUniversities: string[];
  currentDate: string;
  profileData: Record<string, unknown>;
};

const PHASE_DEFS: Array<{
  name: string;
  color: TimelinePhaseColor;
  weight: number;
}> = [
  { name: "GRE Prep", color: "blue", weight: 0.2 },
  { name: "IELTS", color: "amber", weight: 0.12 },
  { name: "Applications", color: "green", weight: 0.28 },
  { name: "Visa", color: "red", weight: 0.12 },
  { name: "Loan", color: "blue", weight: 0.14 },
  { name: "Arrival", color: "green", weight: 0.14 },
];

function parseIsoDate(s: string): Date | null {
  const d = new Date(s + (s.length <= 10 ? "T12:00:00" : ""));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Map common intake labels to an approximate intake month start. */
export function intakeLabelToDate(targetIntake: string): Date {
  const t = targetIntake.trim();
  const m = t.match(/(Fall|Spring|Summer|Winter)\s+(\d{4})/i);
  if (m) {
    const season = m[1].toLowerCase();
    const y = parseInt(m[2], 10);
    if (season === "fall" || season === "autumn") {
      return new Date(Date.UTC(y, 7, 25)); // late Aug
    }
    if (season === "spring") {
      return new Date(Date.UTC(y, 0, 20)); // mid Jan
    }
    if (season === "summer") {
      return new Date(Date.UTC(y, 4, 15));
    }
    if (season === "winter") {
      return new Date(Date.UTC(y, 11, 15));
    }
  }
  const yOnly = t.match(/(\d{4})/);
  if (yOnly) {
    return new Date(Date.UTC(parseInt(yOnly[1], 10), 7, 25));
  }
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear() + 1, 7, 25));
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d.getTime());
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

function formatYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function diffDays(from: Date, to: Date): number {
  const ms = 86400000;
  const a = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  const b = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
  return Math.round((b - a) / ms);
}

function stripJsonFence(text: string): string {
  return text.replace(/```(?:json)?\s*/gi, "").replace(/```\s*$/g, "").trim();
}

function parseAnthropicTimelineJson(text: string): ApplicationTimelinePayload | null {
  const cleaned = stripJsonFence(text);
  try {
    const o = JSON.parse(cleaned) as Partial<ApplicationTimelinePayload>;
    if (
      typeof o.totalWeeks !== "number" ||
      typeof o.intakeDate !== "string" ||
      !Array.isArray(o.phases) ||
      typeof o.aiTip !== "string"
    ) {
      return null;
    }
    const upcoming = Array.isArray(o.upcomingDeadlines)
      ? o.upcomingDeadlines
      : [];
    return { ...o, upcomingDeadlines: upcoming } as ApplicationTimelinePayload;
  } catch {
    return null;
  }
}

export function buildRuleBasedApplicationTimeline(
  input: ApplicationTimelineInput
): ApplicationTimelinePayload {
  const now = parseIsoDate(input.currentDate) ?? new Date();
  const intake = intakeLabelToDate(input.targetIntake);
  const intakeDate = formatYmd(intake);

  let weeksUntil = Math.ceil(diffDays(now, intake) / 7);
  if (weeksUntil < 8) weeksUntil = 36;
  const totalWeeks = Math.min(104, Math.max(weeksUntil + 6, 40));

  const weightSum = PHASE_DEFS.reduce((s, p) => s + p.weight, 0);
  const rawSpans = PHASE_DEFS.map((def) =>
    Math.max(2, Math.round((def.weight / weightSum) * totalWeeks))
  );
  const spanSum = rawSpans.reduce((a, b) => a + b, 0);
  rawSpans[PHASE_DEFS.length - 1] += totalWeeks - spanSum;

  const phases: ApplicationTimelinePhase[] = [];
  let weekOffset = 0;

  for (let i = 0; i < PHASE_DEFS.length; i++) {
    const def = PHASE_DEFS[i];
    const span = rawSpans[i];
    const startWeek = weekOffset + 1;
    const endWeek = weekOffset + span;
    weekOffset = endWeek;

    const milestones: ApplicationTimelineMilestone[] = [];
    const marks = [startWeek, Math.floor((startWeek + endWeek) / 2), endWeek];
    const uniq = [...new Set(marks)].filter((w) => w >= startWeek && w <= endWeek);

    for (const week of uniq) {
      const day = addDays(now, (week - 1) * 7);
      const dateStr = formatYmd(day);
      const daysFromNow = diffDays(now, day);
      const tasks: Record<string, string> = {
        "GRE Prep": "GRE diagnostic + 4-week study block",
        IELTS: "Book IELTS slot + speaking drills",
        Applications: "Finalize SOP + submit 2 priority apps",
        Visa: "DS-160 / CAS + visa fee + interview slot",
        Loan: "Sanction letter + co-borrower KYC to lender",
        Arrival: "Housing deposit + travel booking window",
      };
      const pri: Record<string, MilestonePriority> = {
        "GRE Prep": "medium",
        IELTS: "high",
        Applications: "high",
        Visa: "high",
        Loan: "medium",
        Arrival: "low",
      };
      milestones.push({
        week,
        date: dateStr,
        task: tasks[def.name] ?? `${def.name}: checkpoint`,
        priority: pri[def.name] ?? "medium",
        daysFromNow,
        isOverdue: daysFromNow < 0,
      });
    }

    phases.push({
      phaseName: def.name,
      startWeek,
      endWeek: Math.min(endWeek, totalWeeks),
      color: def.color,
      milestones,
    });
  }

  const flatMilestones = phases.flatMap((p) => p.milestones);
  const upcomingDeadlines: ApplicationTimelineDeadline[] = flatMilestones
    .filter((m) => m.daysFromNow >= 0)
    .sort((a, b) => a.daysFromNow - b.daysFromNow)
    .slice(0, 5)
    .map((m) => ({
      task: m.task,
      date: m.date,
      daysLeft: m.daysFromNow,
    }));

  const uni =
    input.targetUniversities.length > 0
      ? input.targetUniversities.slice(0, 3).join(", ")
      : "your targets";

  return {
    totalWeeks,
    intakeDate,
    phases,
    upcomingDeadlines,
    aiTip: `For ${input.targetCountry} (${uni}), front-load test dates so ${input.targetIntake} apps stay in Round 1/R2 where possible. Cluster recommendation requests early.`,
  };
}

export async function generateApplicationTimeline(input: ApplicationTimelineInput): Promise<{
  data: ApplicationTimelinePayload;
  source: "anthropic" | "fallback";
}> {
  const fallback = () => ({
    data: buildRuleBasedApplicationTimeline(input),
    source: "fallback" as const,
  });

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    return fallback();
  }

  const model = process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL;
  const uniList =
    input.targetUniversities.length > 0
      ? input.targetUniversities.join(", ")
      : "not specified";

  const userPrompt = `Generate a week-by-week application timeline for an Indian student targeting ${input.targetIntake} in ${input.targetCountry}. Universities of interest: ${uniList}. Current calendar date (YYYY-MM-DD): ${input.currentDate}. Profile JSON (opaque context): ${JSON.stringify(input.profileData)}

Return ONLY valid JSON with this exact shape (no markdown, no prose outside JSON):
{ "totalWeeks": number, "intakeDate": string (ISO date), "phases": [{ "phaseName": string, "startWeek": number, "endWeek": number, "color": "blue"|"amber"|"green"|"red", "milestones": [{ "week": number, "date": string (YYYY-MM-DD), "task": string, "priority": "high"|"medium"|"low", "daysFromNow": number, "isOverdue": boolean }] }], "upcomingDeadlines": [{ "task": string, "date": string (YYYY-MM-DD), "daysLeft": number }], "aiTip": string }

Rules:
- Anchor milestones to currentDate; compute daysFromNow and isOverdue vs today.
- upcomingDeadlines should list the next 5 critical items by date.
- totalWeeks should cover from now through intake preparation and arrival.
- Use realistic ordering: GRE/test prep early, applications mid, visa/loan pre-departure.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 8192,
        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
      }),
      signal: AbortSignal.timeout(45000),
    });

    if (!res.ok) {
      console.warn("[generateApplicationTimeline]", await res.text());
      return fallback();
    }

    const body = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = body.content?.find((c) => c.type === "text")?.text?.trim();
    if (!text) return fallback();

    const parsed = parseAnthropicTimelineJson(text);
    if (!parsed || !parsed.phases?.length) return fallback();

    return { data: parsed, source: "anthropic" };
  } catch (e) {
    console.warn("[generateApplicationTimeline]", e);
    return fallback();
  }
}
