/**
 * Client-only shaping of mentor assistant text into answer / reasoning / next_steps.
 * Does not change API contracts — transforms display strings only.
 */

export type MentorStructuredReply = {
  answer: string;
  reasoning: string;
  next_steps: string[];
};

function stripMarkdownBlocks(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s*[-*]{3,}\s*$/gm, "")
    .trim();
}

function splitBullets(block: string): string[] {
  return block
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^[\-\u2022•*\d.)\]]+\s*/, "").trim())
    .filter(Boolean);
}

/**
 * Parses free-form mentor copy into structured UI fields (no markdown in output).
 */
export function transformMentorAssistantText(raw: string): MentorStructuredReply {
  const plain = stripMarkdownBlocks(raw || "").trim();
  if (!plain) {
    return {
      answer: "Let’s tighten your next step — tell me your target country and intake season.",
      reasoning: "I need one concrete anchor to avoid generic advice.",
      next_steps: ["Open Improve Profile and confirm destinations.", "Share one admissions deadline you’re aiming for."],
    };
  }

  const sections = plain.split(/\n\n+/).map((s) => s.trim()).filter(Boolean);

  let answer = sections[0] ?? plain.slice(0, 600);
  let reasoning = "";
  let next_steps: string[] = [];

  const lowerFull = plain.toLowerCase();
  const reasoningIdx = plain.search(/\n\s*(reasoning|why this matters|because)\s*:/i);
  const nextIdx = plain.search(/\n\s*(next steps?|what to do|actions)\s*:/i);

  if (reasoningIdx > 0 && nextIdx > reasoningIdx) {
    answer = plain.slice(0, reasoningIdx).trim();
    reasoning = plain.slice(reasoningIdx, nextIdx).replace(/^[^\n]*:/, "").trim();
    const tail = plain.slice(nextIdx);
    next_steps = splitBullets(tail.replace(/^[^\n]*:/, ""));
  } else if (sections.length >= 2) {
    answer = sections[0];
    reasoning = sections[1];
    next_steps = sections.slice(2).flatMap((b) => splitBullets(b));
  }

  if (!reasoning && sections.length >= 2) {
    reasoning = sections[1];
  }

  const bulletCandidates = plain
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^[\-\u2022•*\d]/.test(l));
  if (next_steps.length === 0 && bulletCandidates.length) {
    next_steps = bulletCandidates.map((l) => l.replace(/^[\-\u2022•*\d.)]+\s*/, "").trim()).filter(Boolean).slice(0, 8);
  }

  if (next_steps.length === 0) {
    next_steps = [
      "Pick one deadline in the next 30 days and work backward.",
      "Add one proof point (project, internship, or test plan) to your profile.",
      "Confirm whether your reach/match/safety list still matches your CGPA band.",
    ];
  }

  answer = stripMarkdownBlocks(answer).slice(0, 1200);
  reasoning = stripMarkdownBlocks(reasoning || "").slice(0, 800);

  if (!reasoning) {
    reasoning =
      "This guidance ties to what you’ve already saved — adjust destinations or scores if your situation shifted.";
  }

  return { answer, reasoning, next_steps: next_steps.slice(0, 8) };
}
