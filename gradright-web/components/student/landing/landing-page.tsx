"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ChevronRight,
  Globe2,
  GraduationCap,
  Heart,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { CountUp } from "@/components/student/landing/count-up";
import { GlassCard } from "@/components/student/landing/glass-card";
import { ScoreRing } from "@/components/student/landing/score-ring";
import { cn } from "@/lib/utils";

const ROTATING = [
  "USA 🇺🇸",
  "UK 🇬🇧",
  "Germany 🇩🇪",
  "Canada 🇨🇦",
  "Singapore 🇸🇬",
  "Australia 🇦🇺",
];

const SIGNUP_ONBOARDING = "/sign-up?next=/onboarding";
const LOGIN_ONBOARDING = "/sign-in?next=/onboarding";

function CtaPrimary({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full bg-brand-primary px-5 py-3 text-sm font-semibold text-white shadow-elegant ring-glow pressable",
        className
      )}
    >
      {children}
    </Link>
  );
}

function CtaGhost({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full glass-strong px-5 py-3 text-sm font-semibold pressable",
        className
      )}
    >
      {children}
    </Link>
  );
}

export function LandingPage() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(
      () => setIdx((i) => (i + 1) % ROTATING.length),
      1800
    );
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 bg-gradient-radial-hero" />

      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/45 backdrop-blur-xl">
        <div className="container mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-xl bg-brand-primary">
              <Sparkles className="size-5 text-white" />
            </div>
            <span className="font-heading text-xl font-bold tracking-tight">
              GradRight
            </span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#how" className="transition hover:text-foreground">
              How it works
            </a>
            <a href="#finance" className="transition hover:text-foreground">
              Finance
            </a>
            <a href="#community" className="transition hover:text-foreground">
              Community
            </a>
            <a href="#parents" className="transition hover:text-foreground">
              For parents
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/sign-in"
              className="hidden rounded-full px-4 py-2 text-sm transition hover:bg-muted/60 sm:inline-flex"
            >
              Log in
            </Link>
            <CtaPrimary href={SIGNUP_ONBOARDING} className="px-4 py-2">
              Get my GradScore <ArrowRight className="size-4" />
            </CtaPrimary>
          </div>
        </div>
      </header>

      <section className="container relative mx-auto max-w-6xl px-4 pb-20 pt-16 md:pt-24">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs"
            >
              <span className="size-2 animate-pulse rounded-full bg-brand-mint" />
              AI-powered student OS · your grad path
            </motion.div>
            <h1 className="mt-5 font-heading text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
              Discover your future in{" "}
              <span className="relative inline-block align-baseline">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={idx}
                    initial={{ y: 28, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -28, opacity: 0 }}
                    transition={{ duration: 0.38 }}
                    className="text-gradient inline-block"
                  >
                    {ROTATING[idx]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              GradRight is your co-pilot for studying abroad — university match,
              career signals, loan readiness, and a path that feels{" "}
              <span className="font-medium text-foreground">yours</span>.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <CtaPrimary href={SIGNUP_ONBOARDING}>
                Start my journey <ArrowRight className="size-4" />
              </CtaPrimary>
              <CtaGhost href={SIGNUP_ONBOARDING}>
                <Sparkles className="size-4 text-brand-primary" />
                See your score — ~90s
              </CtaGhost>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              <Link
                href={LOGIN_ONBOARDING}
                className="font-medium text-brand-primary underline-offset-4 hover:underline"
              >
                Already have an account? Log in
              </Link>{" "}
              to continue your Grad path.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Shield className="size-4 shrink-0" />
                Privacy-first · you control your data
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="size-4 shrink-0 text-brand-amber" />
                Built for Indian students going global
              </div>
            </div>
          </div>

          <div className="relative lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.65, delay: 0.08 }}
            >
              <GlassCard gradient className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                      Your GradScore
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Live preview · personalized after sign-up
                    </div>
                  </div>
                  <span className="text-2xl" aria-hidden>
                    🎓
                  </span>
                </div>
                <div className="mt-2 flex justify-center">
                  <ScoreRing
                    value={87}
                    label="Grad potential"
                    sublabel="Top tier readiness signal"
                  />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="glass rounded-xl p-2.5">
                    <div className="text-[10px] text-muted-foreground">
                      Best fit
                    </div>
                    <div className="mt-0.5 text-sm font-semibold">USA 🇺🇸</div>
                  </div>
                  <div className="glass rounded-xl p-2.5">
                    <div className="text-[10px] text-muted-foreground">
                      Salary
                    </div>
                    <div className="mt-0.5 text-sm font-semibold">
                      $<CountUp to={112} />
                      K
                    </div>
                  </div>
                  <div className="glass rounded-xl p-2.5">
                    <div className="text-[10px] text-muted-foreground">
                      Match
                    </div>
                    <div className="mt-0.5 text-sm font-semibold">
                      <CountUp to={92} />%
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <CtaPrimary href={SIGNUP_ONBOARDING} className="w-full py-2.5">
                    Unlock my real score
                    <ArrowRight className="size-4" />
                  </CtaPrimary>
                </div>
              </GlassCard>
            </motion.div>
            <motion.div
              animate={{ y: [-6, 6, -6] }}
              transition={{ duration: 6, repeat: Infinity }}
              className="absolute -left-6 -top-6 hidden md:block"
            >
              <GlassCard className="flex items-center gap-2 p-3 text-xs">
                <span aria-hidden>🔥</span> Streak-ready habits
              </GlassCard>
            </motion.div>
            <motion.div
              animate={{ y: [6, -6, 6] }}
              transition={{ duration: 7, repeat: Infinity }}
              className="absolute -bottom-6 -right-2 hidden md:block"
            >
              <GlassCard className="flex items-center gap-2 p-3 text-xs">
                <Heart className="size-3.5 text-brand-pink" aria-hidden />
                Peer wins & nudges
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4">
        <div className="glass-strong flex flex-col gap-6 rounded-3xl p-6 md:flex-row md:items-center md:gap-10 md:p-8">
          <div className="text-sm text-muted-foreground md:max-w-[200px]">
            Students aiming for world-class programs
          </div>
          <div className="grid flex-1 grid-cols-3 gap-4 text-center font-heading text-sm font-semibold text-foreground/70 md:grid-cols-6">
            {["MIT", "Stanford", "Imperial", "UCL", "TUM", "NUS"].map((s) => (
              <div
                key={s}
                className="opacity-70 transition hover:opacity-100"
              >
                {s}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="container mx-auto max-w-6xl px-4 py-24">
        <div className="max-w-2xl">
          <h2 className="font-heading text-4xl font-bold tracking-tight md:text-5xl">
            A whole product, built around{" "}
            <span className="text-gradient">you</span>.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From the first quiz to your offer — every step learns your profile
            and adapts.{" "}
            <Link
              href={SIGNUP_ONBOARDING}
              className="font-semibold text-brand-primary underline-offset-4 hover:underline"
            >
              Click here to see your score
            </Link>{" "}
            after a quick sign-up.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            {
              icon: GraduationCap,
              title: "Match universities",
              desc: "Targets that fit your goals, budget, and odds — refreshed as you grow.",
              color: "from-brand-primary/35 to-brand-blue/25",
            },
            {
              icon: Wallet,
              title: "Plan your finance",
              desc: "ROI, scholarships, EMIs, and a calmer parent conversation.",
              color: "from-brand-mint/35 to-brand-blue/20",
            },
            {
              icon: Users,
              title: "Your grad path",
              desc: "One guided journey: milestones, documents, and financing nudges.",
              color: "from-brand-pink/30 to-brand-primary/20",
            },
          ].map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.1, duration: 0.45 }}
            >
              <GlassCard className="hover-lift h-full p-6">
                <div
                  className={cn(
                    "grid size-11 place-items-center rounded-xl bg-gradient-to-br",
                    c.color
                  )}
                >
                  <c.icon className="size-5 text-foreground" />
                </div>
                <h3 className="mt-4 font-heading text-xl font-semibold">
                  {c.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
                <Link
                  href={SIGNUP_ONBOARDING}
                  className="mt-4 inline-flex items-center text-sm font-medium text-foreground/90 transition hover:text-brand-primary"
                >
                  Start free <ChevronRight className="size-4" />
                </Link>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="finance" className="container mx-auto max-w-6xl px-4 py-12">
        <GlassCard gradient className="grid items-center gap-8 p-8 md:grid-cols-2 md:p-12">
          <div>
            <div className="text-xs font-medium uppercase tracking-widest text-brand-mint">
              Money, made empowering
            </div>
            <h2 className="mt-3 font-heading text-4xl font-bold">
              See the full cost.{" "}
              <span className="text-gradient">Know the payoff.</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              Tuition, living, FX, scholarships, EMIs — visualized so you feel
              confident, not overwhelmed.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                "Tuition planner",
                "Loan readiness",
                "ROI snapshot",
                "Parent view",
              ].map((t) => (
                <span key={t} className="glass rounded-full px-3 py-1.5 text-xs">
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-6">
              <CtaGhost href={SIGNUP_ONBOARDING} className="text-brand-primary">
                Build my financing picture
                <ArrowRight className="size-4" />
              </CtaGhost>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <GlassCard className="p-4">
              <div className="text-xs text-muted-foreground">Tuition (illustrative)</div>
              <div className="font-heading text-2xl font-bold">
                $<CountUp to={58} />
                K/yr
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-brand-primary"
                  initial={{ width: 0 }}
                  whileInView={{ width: "72%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9 }}
                />
              </div>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs text-muted-foreground">Salary outlook</div>
              <div className="font-heading text-2xl font-bold">
                $<CountUp to={125} />
                K
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-gradient-mint"
                  initial={{ width: 0 }}
                  whileInView={{ width: "88%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, delay: 0.1 }}
                />
              </div>
            </GlassCard>
            <GlassCard className="col-span-2 p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Directional ROI</span>
                <span>Illustrative</span>
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-heading text-3xl font-bold text-gradient">
                  3.4×
                </span>
                <TrendingUp className="size-5 text-brand-success" />
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Not financial advice — your dashboard personalizes from real
                inputs.
              </div>
            </GlassCard>
          </div>
        </GlassCard>
      </section>

      <section
        id="community"
        className="container mx-auto grid max-w-6xl gap-6 px-4 py-24 md:grid-cols-2"
      >
        <GlassCard className="p-8">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-brand-pink">
            <Users className="size-3.5" />
            Community
          </div>
          <h3 className="mt-3 font-heading text-3xl font-bold">
            Students on similar paths are already here.
          </h3>
          <p className="mt-2 text-muted-foreground">
            Country crews, challenges, and wins — plus AI nudges that keep you
            moving.
          </p>
          <div className="mt-5 space-y-2">
            {[
              { who: "Aarav", what: "targeting CMU MSCS", emoji: "🧑‍🚀", t: "2h" },
              { who: "Mei", what: "shared her SOP framework", emoji: "👩‍💻", t: "4h" },
              {
                who: "Noah",
                what: "tracking scholarship deadlines",
                emoji: "🧑‍🎓",
                t: "1d",
              },
            ].map((p, i) => (
              <div
                key={i}
                className="glass flex items-center gap-3 rounded-xl p-3"
              >
                <div className="text-xl" aria-hidden>
                  {p.emoji}
                </div>
                <div className="text-sm">
                  <span className="font-semibold">{p.who}</span> {p.what}
                </div>
                <span className="ml-auto text-xs text-muted-foreground">
                  {p.t}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Link
              href={SIGNUP_ONBOARDING}
              className="text-sm font-semibold text-brand-primary underline-offset-4 hover:underline"
            >
              Join the journey →
            </Link>
          </div>
        </GlassCard>
        <GlassCard className="p-8" id="parents">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-brand-amber">
            <Heart className="size-3.5" />
            Parents
          </div>
          <h3 className="mt-3 font-heading text-3xl font-bold">
            Built so parents feel safe, not stressed.
          </h3>
          <p className="mt-2 text-muted-foreground">
            Clear costs, ROI context, and loan clarity — with your progress in
            one place.
          </p>
          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            <GlassCard className="p-3">
              <div className="text-[10px] text-muted-foreground">Total cost</div>
              <div className="font-heading font-bold">$148K</div>
            </GlassCard>
            <GlassCard className="p-3">
              <div className="text-[10px] text-muted-foreground">ROI lens</div>
              <div className="font-heading font-bold">3.4×</div>
            </GlassCard>
            <GlassCard className="p-3">
              <div className="text-[10px] text-muted-foreground">Loan ready</div>
              <div className="font-heading font-bold">82/100</div>
            </GlassCard>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <CtaPrimary href={SIGNUP_ONBOARDING} className="py-2.5">
              Show me my Grad path
              <ArrowRight className="size-4" />
            </CtaPrimary>
            <Link
              href="/sign-in"
              className="inline-flex items-center rounded-full px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Log in instead
            </Link>
          </div>
        </GlassCard>
      </section>

      <section className="container mx-auto max-w-6xl px-4 pb-28">
        <div className="bg-brand-soft relative overflow-hidden rounded-3xl border border-border p-10 text-center md:p-16">
          <div className="pointer-events-none absolute inset-0 bg-gradient-radial-hero opacity-90" />
          <div className="pointer-events-none absolute -left-32 -top-32 size-96 rounded-full bg-brand-primary/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -right-32 size-96 rounded-full bg-gradient-pink opacity-40 blur-3xl" />
          <div className="relative">
            <Globe2 className="mx-auto size-10 text-brand-mint" aria-hidden />
            <h2 className="mt-4 font-heading text-4xl font-bold tracking-tight md:text-6xl">
              Your future is one tap away.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Sign up to unlock your GradScore and a dashboard that grows with
              you — or log in to pick up where you left off.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <CtaPrimary href={SIGNUP_ONBOARDING} className="px-7 py-3.5">
                Get my GradScore
                <ArrowRight className="size-4" />
              </CtaPrimary>
              <CtaGhost href="/sign-in">
                I already have an account
              </CtaGhost>
            </div>
          </div>
        </div>
        <p className="mt-10 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} GradRight · Made for the next generation
        </p>
      </section>
    </div>
  );
}
