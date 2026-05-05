"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  ChevronDown,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  UploadCloud,
  User,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { GlassCard } from "@/components/shell/GlassCard";
import { Button } from "@/components/ui/button";
import {
  PROFILE_INTEL_CHAT_INTRO,
  PROFILE_INTEL_CHAT_SUGGESTIONS,
} from "@/lib/profile/profile-intelligence-chat-config";
import { cn } from "@/lib/utils";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

type ParsedResumePreview = {
  skills: string[];
  projects: { title: string; description?: string }[];
  internships: { org: string; role?: string; duration?: string }[];
  estimated_total_experience_years?: number | null;
};

function normalizeParsedResume(raw: unknown): ParsedResumePreview {
  const r = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const skills = Array.isArray(r.skills)
    ? r.skills.map((s) => String(s).trim()).filter(Boolean)
    : [];
  const projectsRaw = Array.isArray(r.projects) ? r.projects : [];
  const projects = projectsRaw.map((p) => {
    const o = p && typeof p === "object" ? (p as Record<string, unknown>) : {};
    const title = typeof o.title === "string" ? o.title.trim() : "";
    const description = typeof o.description === "string" ? o.description.trim() : undefined;
    return { title: title || "Project", description };
  });
  const intRaw = Array.isArray(r.internships) ? r.internships : [];
  const internships = intRaw.map((p) => {
    const o = p && typeof p === "object" ? (p as Record<string, unknown>) : {};
    const org = typeof o.org === "string" ? o.org.trim() : "";
    const role = typeof o.role === "string" ? o.role.trim() : undefined;
    const duration = typeof o.duration === "string" ? o.duration.trim() : undefined;
    return { org: org || "Organization", role, duration };
  });
  const est = r.estimated_total_experience_years;
  const estimated_total_experience_years =
    typeof est === "number" && Number.isFinite(est) ? est : null;
  return { skills, projects, internships, estimated_total_experience_years };
}

function uid(): string {
  return crypto.randomUUID();
}

function formatBold(line: string): React.ReactNode {
  const parts = line.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((p, j) =>
        j % 2 === 1 ? (
          <strong key={j} className="font-semibold text-foreground">
            {p}
          </strong>
        ) : (
          p
        )
      )}
    </>
  );
}

function Markdownish({ text, className }: { text: string; className?: string }) {
  const lines = text.split("\n");
  return (
    <div className={cn("space-y-1.5 text-[15px] leading-relaxed tracking-tight", className)}>
      {lines.map((line, i) => {
        const t = line.trim();
        if (t.startsWith("## ")) {
          return (
            <h3
              key={i}
              className="pt-1 font-heading text-lg font-semibold tracking-tight text-foreground"
            >
              {formatBold(t.slice(3))}
            </h3>
          );
        }
        if (t.startsWith("### ")) {
          return (
            <h4 key={i} className="font-heading text-base font-semibold text-foreground">
              {formatBold(t.slice(4))}
            </h4>
          );
        }
        if (t.startsWith("- ") || t.startsWith("* ")) {
          return (
            <p
              key={i}
              className="border-l-2 border-brand-primary/40 pl-3 text-[14px] text-muted-foreground"
            >
              {formatBold(t.slice(2))}
            </p>
          );
        }
        if (!t) return <div key={i} className="h-1" />;
        return (
          <p key={i} className="text-[14px] text-muted-foreground">
            {formatBold(line)}
          </p>
        );
      })}
    </div>
  );
}

function ExtractionPreview({
  data,
  coachMarkdown,
}: {
  data: ParsedResumePreview;
  coachMarkdown: string;
}) {
  return (
    <div className="space-y-5 rounded-2xl border border-brand-primary/20 bg-gradient-to-b from-brand-soft/40 to-background/80 p-5 shadow-inner">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-primary">
            Parsed résumé
          </p>
          <p className="mt-1 font-heading text-lg font-semibold text-foreground">
            Ready to save
          </p>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            These fields sync to your student profile for dashboard, explore, and funding context.
          </p>
        </div>
        {data.estimated_total_experience_years != null ? (
          <div className="rounded-xl border border-border/70 bg-card/90 px-3 py-2 text-center shadow-sm">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Est. experience
            </p>
            <p className="font-heading text-xl font-bold text-foreground">
              ~{data.estimated_total_experience_years} yrs
            </p>
          </div>
        ) : null}
      </div>

      <div className="max-h-[min(52vh,420px)] space-y-5 overflow-y-auto pr-1">
        <section>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Skills
          </h4>
          {data.skills.length ? (
            <ul className="flex flex-wrap gap-2">
              {data.skills.map((s) => (
                <li
                  key={s}
                  className="rounded-full border border-border/60 bg-card px-3 py-1 text-xs font-medium text-foreground shadow-sm"
                >
                  {s}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No skills listed — you can still save.</p>
          )}
        </section>

        <section>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Projects
          </h4>
          {data.projects.length ? (
            <ul className="space-y-3">
              {data.projects.map((p, i) => (
                <li
                  key={`${p.title}-${i}`}
                  className="rounded-xl border border-border/50 bg-card/70 px-4 py-3 text-sm shadow-sm"
                >
                  <p className="font-semibold text-foreground">{p.title}</p>
                  {p.description ? (
                    <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                      {p.description}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">None extracted.</p>
          )}
        </section>

        <section>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Internships
          </h4>
          {data.internships.length ? (
            <ul className="space-y-2">
              {data.internships.map((n, i) => (
                <li
                  key={`${n.org}-${i}`}
                  className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-foreground">{n.org}</span>
                  {n.role ? (
                    <span className="text-muted-foreground"> — {n.role}</span>
                  ) : null}
                  {n.duration ? (
                    <span className="block text-xs text-muted-foreground">{n.duration}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">None extracted.</p>
          )}
        </section>
      </div>

      {coachMarkdown.trim().length > 40 ? (
        <details className="group rounded-xl border border-dashed border-border/70 bg-muted/15 px-4 py-2">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
            <ChevronDown className="h-4 w-4 shrink-0 transition group-open:rotate-180" />
            Gemini summary (expand)
          </summary>
          <div className="mt-3 border-t border-border/40 pt-3">
            <Markdownish text={coachMarkdown} className="text-[13px]" />
          </div>
        </details>
      ) : null}
    </div>
  );
}

const FIRST_FOLLOWUP =
  "### Next up\nYour résumé signals are saved on your profile. **Where do you see yourself in the next five years?** Include geography if it matters (for example US, UK, EU, or India). A few sentences is perfect.";

export function ProfileIntelligenceGeminiChat() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { id: uid(), role: "assistant", content: PROFILE_INTEL_CHAT_INTRO },
  ]);
  const [input, setInput] = useState("");
  const [resumePath, setResumePath] = useState<string | null>(null);
  const [extractedContext, setExtractedContext] = useState("");
  const [parsedResume, setParsedResume] = useState<ParsedResumePreview | null>(null);
  const [coachMarkdown, setCoachMarkdown] = useState("");
  const [savedToProfile, setSavedToProfile] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [extractBusy, setExtractBusy] = useState(false);
  const [saveExtractBusy, setSaveExtractBusy] = useState(false);
  const [streamBusy, setStreamBusy] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [bannerTone, setBannerTone] = useState<"error" | "success" | "neutral">("neutral");

  messagesRef.current = messages;

  const chatUnlocked = savedToProfile;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, streamBusy, parsedResume, saveExtractBusy]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/user/dashboard-brief");
        const json = (await res.json()) as {
          success?: boolean;
          data?: { profile?: Record<string, unknown> | null };
        };
        if (!res.ok || !json.success || !json.data?.profile || cancelled) return;
        const p = json.data.profile;
        const rurl = typeof p.resume_file_url === "string" ? p.resume_file_url : "";
        if (rurl.includes("profile-resumes/") && !rurl.includes("..")) {
          setResumePath(rurl);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const aspirationFromChat = useMemo(() => {
    const lines = messages
      .filter((m) => m.role === "user")
      .map((m) => m.content.trim())
      .filter(Boolean);
    return lines.join("\n\n").slice(0, 12000);
  }, [messages]);

  const onUpload = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setBanner(null);
    setBannerTone("neutral");
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/user/profile-resume", {
        method: "POST",
        body: fd,
      });
      const json = (await res.json()) as {
        success?: boolean;
        data?: { storage_path?: string };
        error?: string;
      };
      if (!res.ok || !json.success || !json.data?.storage_path) {
        setBannerTone("error");
        setBanner(json.error ?? "Upload failed — try a smaller PDF or TXT.");
        return;
      }
      setResumePath(json.data.storage_path);
      setParsedResume(null);
      setCoachMarkdown("");
      setExtractedContext("");
      setSavedToProfile(false);
      setBannerTone("neutral");
      setBanner("Résumé linked — run **Analyze résumé**, then **Save to profile**.");
    } catch {
      setBannerTone("error");
      setBanner("Network error during upload.");
    } finally {
      setUploading(false);
    }
  };

  const runExtract = useCallback(async () => {
    if (!resumePath) {
      setBannerTone("error");
      setBanner("Upload a résumé first.");
      return;
    }
    setExtractBusy(true);
    setBanner(null);
    setBannerTone("neutral");
    try {
      const res = await fetch("/api/ai/profile-intelligence-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "extract",
          resume_storage_path: resumePath,
        }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        error?: string;
        data?: {
          assistant_markdown?: string;
          extracted_context?: string;
          parsed_resume?: ParsedResumePreview;
        };
      };
      if (!res.ok || !json.success || !json.data) {
        setBannerTone("error");
        setBanner(json.error ?? "Extraction failed.");
        return;
      }
      setParsedResume(normalizeParsedResume(json.data.parsed_resume ?? {}));
      setCoachMarkdown(json.data.assistant_markdown?.trim() ?? "");
      setExtractedContext(json.data.extracted_context?.trim() ?? "");
      setSavedToProfile(false);
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content:
            "### Résumé parsed\nReview the structured snapshot below. When it looks right, tap **Save to profile** — then we will continue in this thread with your goals and plans.",
        },
      ]);
      setBannerTone("neutral");
      setBanner(null);
    } catch {
      setBannerTone("error");
      setBanner("Network error during extraction.");
    } finally {
      setExtractBusy(false);
    }
  }, [resumePath]);

  const saveExtractionToProfile = useCallback(async () => {
    if (!resumePath || !parsedResume) {
      setBannerTone("error");
      setBanner("Nothing to save — run extraction first.");
      return;
    }
    setSaveExtractBusy(true);
    setBanner(null);
    try {
      const res = await fetch("/api/user/profile-chat-extraction-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_storage_path: resumePath,
          skills: parsedResume.skills,
          projects: parsedResume.projects,
          internships: parsedResume.internships,
          estimated_total_experience_years: parsedResume.estimated_total_experience_years ?? null,
        }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        error?: string;
        data?: { profile_completeness_score?: number };
      };
      if (!res.ok || !json.success) {
        setBannerTone("error");
        setBanner(json.error ?? "Could not save extraction.");
        return;
      }
      setSavedToProfile(true);
      const sc = json.data?.profile_completeness_score;
      setBannerTone("success");
      setBanner(
        sc != null
          ? `Saved to your profile. Completeness is around ${sc}%.`
          : "Saved to your profile."
      );
      setMessages((prev) => [...prev, { id: uid(), role: "assistant", content: FIRST_FOLLOWUP }]);
    } catch {
      setBannerTone("error");
      setBanner("Network error while saving.");
    } finally {
      setSaveExtractBusy(false);
    }
  }, [parsedResume, resumePath]);

  const appendChatNotes = useCallback(async (userLine: string, assistantLine: string) => {
    const block = `Profile coach (Gemini)\nUser: ${userLine}\nAssistant: ${assistantLine.slice(0, 3500)}`;
    try {
      await fetch("/api/user/profile-chat-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ block }),
      });
    } catch {
      /* non-blocking */
    }
  }, []);

  const streamAssistant = useCallback(
    async (history: ChatMessage[]) => {
      const payload = history.map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/ai/profile-intelligence-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "chat",
          messages: payload,
          extracted_context: extractedContext || undefined,
        }),
      });
      if (!res.ok) {
        const raw = await res.text().catch(() => "");
        let err = raw.trim() || `Chat request failed (${res.status}).`;
        try {
          const j = JSON.parse(raw) as { error?: string };
          if (j?.error) err = j.error;
        } catch {
          /* plain-text error body */
        }
        throw new Error(err);
      }
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream.");
      const dec = new TextDecoder();
      let acc = "";
      const assistantId = uid();
      const lastUser = [...history].reverse().find((m) => m.role === "user");
      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: acc } : m))
        );
      }
      if (lastUser?.content.trim() && acc.trim()) {
        void appendChatNotes(lastUser.content.trim(), acc.trim());
      }
    },
    [appendChatNotes, extractedContext]
  );

  const sendUserText = useCallback(
    async (text: string): Promise<boolean> => {
      const trimmed = text.trim();
      if (!trimmed || streamBusy) return false;
      if (!chatUnlocked) {
        setBannerTone("error");
        setBanner("Save your résumé extraction to your profile first — then chat unlocks.");
        return false;
      }
      setBanner(null);
      setBannerTone("neutral");
      setStreamBusy(true);
      const userMsg: ChatMessage = { id: uid(), role: "user", content: trimmed };
      const prior = messagesRef.current;
      const next = [...prior, userMsg];
      setMessages(next);
      try {
        await streamAssistant(next);
        return true;
      } catch (e) {
        setBannerTone("error");
        setBanner(e instanceof Error ? e.message : "Chat failed.");
        setMessages(prior);
        return false;
      } finally {
        setStreamBusy(false);
      }
    },
    [chatUnlocked, streamAssistant, streamBusy]
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = input;
    void sendUserText(t).then((ok) => {
      if (ok) setInput("");
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-24 pt-4">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to dashboard
      </Link>

      <header className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-pink">
          Profile intelligence
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Profile coach
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
          Upload your résumé, review what Gemini extracted, save it to your profile, then continue
          here — goals, countries, and priorities stay in one thread and feed the rest of GradRight.
        </p>
      </header>

      <GlassCard className="flex flex-col overflow-hidden border-brand-primary/25 p-0 shadow-elegant">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-gradient-to-r from-muted/30 to-transparent px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary text-white shadow-md">
              <MessageSquare className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Live thread
              </p>
              <p className="font-heading text-lg font-semibold text-foreground">Gemini coach</p>
            </div>
          </div>
          {streamBusy ? (
            <span className="flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              Writing…
            </span>
          ) : savedToProfile ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
              Profile linked
            </span>
          ) : null}
        </div>

        <div className="border-b border-border/50 bg-muted/10 px-5 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <label className="flex min-h-[88px] flex-1 cursor-pointer flex-col justify-center gap-2 rounded-2xl border border-dashed border-border/80 bg-background/70 px-4 py-4 transition hover:border-brand-primary/50 hover:bg-background">
              <div className="flex items-center gap-3">
                <UploadCloud className="h-6 w-6 shrink-0 text-brand-primary" aria-hidden />
                <div className="min-w-0 text-left">
                  <p className="text-sm font-semibold text-foreground">
                    {uploading ? "Uploading…" : "Résumé file"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {resumePath ? resumePath.split("/").pop() : "PDF or TXT — tap to browse"}
                  </p>
                </div>
              </div>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.md,application/pdf"
                className="sr-only"
                disabled={uploading}
                onChange={(e) => void onUpload(e.target.files?.[0] ?? null)}
              />
            </label>
            <Button
              type="button"
              variant="secondary"
              className="h-11 shrink-0 rounded-xl px-6 sm:self-stretch"
              disabled={!resumePath || extractBusy}
              onClick={() => void runExtract()}
            >
              {extractBusy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Analyzing…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" aria-hidden />
                  Analyze résumé
                </>
              )}
            </Button>
          </div>
        </div>

        {parsedResume && !savedToProfile ? (
          <div className="space-y-4 border-b border-border/50 px-5 py-5">
            <ExtractionPreview data={parsedResume} coachMarkdown={coachMarkdown} />
            <Button
              type="button"
              className="h-12 w-full rounded-xl text-base font-semibold shadow-md sm:w-auto sm:min-w-[240px]"
              disabled={saveExtractBusy}
              onClick={() => void saveExtractionToProfile()}
            >
              {saveExtractBusy ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden />
                  Saving…
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5" aria-hidden />
                  Save extraction to profile
                </>
              )}
            </Button>
          </div>
        ) : null}

        {banner ? (
          <div
            className={cn(
              "mx-5 mt-4 rounded-xl border px-4 py-3 text-sm",
              bannerTone === "error" && "border-destructive/40 bg-destructive/10 text-destructive",
              bannerTone === "success" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100",
              bannerTone === "neutral" && "border-border/60 bg-muted/30 text-foreground"
            )}
          >
            {bannerTone === "success" ? (
              <span className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>{banner}</span>
              </span>
            ) : (
              banner
            )}
          </div>
        ) : null}

        <div
          ref={scrollRef}
          className="min-h-[280px] space-y-5 overflow-y-auto px-5 py-6"
          style={{ maxHeight: "min(58vh, 640px)" }}
        >
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex gap-3", m.role === "user" ? "flex-row-reverse" : "flex-row")}
              >
                <div
                  className={cn(
                    "mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-2xl border text-xs shadow-sm",
                    m.role === "user"
                      ? "border-border/80 bg-background text-muted-foreground"
                      : "border-brand-primary/35 bg-brand-soft text-brand-primary"
                  )}
                >
                  {m.role === "user" ? (
                    <User className="h-[18px] w-[18px]" aria-hidden />
                  ) : (
                    <Bot className="h-[18px] w-[18px]" aria-hidden />
                  )}
                </div>
                <div
                  className={cn(
                    "min-w-0 max-w-[min(100%,720px)] rounded-2xl border px-5 py-4 shadow-sm",
                    m.role === "user"
                      ? "border-brand-primary/20 bg-gradient-to-br from-brand-primary/12 via-brand-primary/8 to-brand-secondary/10"
                      : "border-border/60 bg-card/95 backdrop-blur-sm"
                  )}
                >
                  <Markdownish text={m.content} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {chatUnlocked ? (
          <div className="border-t border-border/50 bg-muted/10 px-4 py-4">
            <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Suggested follow-ups
            </p>
            <div className="flex flex-wrap gap-2">
              {PROFILE_INTEL_CHAT_SUGGESTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  disabled={streamBusy}
                  onClick={() => void sendUserText(s.prompt)}
                  className="rounded-full border border-border/70 bg-background/95 px-3.5 py-2 text-left text-xs font-medium text-foreground shadow-sm transition hover:border-brand-primary/45 hover:bg-brand-soft/50 disabled:opacity-50"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <form
          onSubmit={onSubmit}
          className="flex gap-3 border-t border-border/60 bg-background/90 p-4 md:p-5"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                const t = input;
                void sendUserText(t).then((ok) => {
                  if (ok) setInput("");
                });
              }
            }}
            rows={2}
            disabled={streamBusy}
            placeholder={
              chatUnlocked
                ? "Reply in your own words, or tap a chip above…"
                : "Save your extraction above to unlock the conversation."
            }
            className="min-h-[52px] flex-1 resize-none rounded-xl border border-input bg-background px-4 py-3 text-[15px] leading-snug outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-55"
          />
          <Button
            type="submit"
            disabled={streamBusy || !input.trim() || !chatUnlocked}
            className="h-auto min-w-[52px] shrink-0 self-end rounded-xl px-5"
            size="lg"
          >
            {streamBusy ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            ) : (
              <Send className="h-5 w-5" aria-hidden />
            )}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </GlassCard>

      {aspirationFromChat.length > 80 && chatUnlocked ? (
        <p className="px-1 text-center text-xs text-muted-foreground">
          Your replies in this thread are appended to your profile notes for downstream modules.
        </p>
      ) : null}
    </div>
  );
}
