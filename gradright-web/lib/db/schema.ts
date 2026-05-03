import type { DocumentRecord, NextBestAction, RiskDriver } from "@/lib/types";
import {
  boolean,
  date,
  decimal,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// ─── ENUMS ───────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", [
  "student",
  "nbfc_supervisor",
  "admin",
]);

export const journeyStageEnum = pgEnum("journey_stage", [
  "discover",
  "plan",
  "finance",
  "apply",
  "succeed",
]);

export const riskLabelEnum = pgEnum("risk_label", [
  "low",
  "medium",
  "high",
]);

export const loanStatusEnum = pgEnum("loan_status", [
  "draft",
  "submitted",
  "under_review",
  "approved",
  "rejected",
  "manual_review",
]);

// ─── TABLES ──────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  supabase_uid: text("supabase_uid").unique().notNull(),
  email: text("email").unique().notNull(),
  full_name: text("full_name"),
  phone: text("phone"),
  role: userRoleEnum("role").default("student").notNull(),
  consent_given: boolean("consent_given").default(false).notNull(),
  consent_timestamp: timestamp("consent_timestamp", {
    withTimezone: true,
    mode: "string",
  }),
  onboarding_complete: boolean("onboarding_complete").default(false).notNull(),
  wow_completed: boolean("wow_completed").default(false).notNull(),
  journey_stage: journeyStageEnum("journey_stage")
    .default("discover")
    .notNull(),
  xp_points: integer("xp_points").default(0).notNull(),
  streak_days: integer("streak_days").default(0).notNull(),
  last_active_date: date("last_active_date", { mode: "string" }),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
});

export const student_profiles = pgTable("student_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  target_country: text("target_country"),
  target_intake: text("target_intake"),
  degree_type: text("degree_type"),
  broad_field: text("broad_field"),
  current_academic_level: text("current_academic_level"),
  work_experience_years: integer("work_experience_years").default(0),
  loan_needed: boolean("loan_needed").default(true),
  budget_band_usd: text("budget_band_usd"),
  institute_name: text("institute_name"),
  institute_tier: text("institute_tier"),
  cgpa: decimal("cgpa", { precision: 4, scale: 2 }),
  cgpa_scale: decimal("cgpa_scale", { precision: 3, scale: 1 }).default("10"),
  internship_count: integer("internship_count").default(0),
  internship_months_total: integer("internship_months_total").default(0),
  certification_count: integer("certification_count").default(0),
  target_universities: jsonb("target_universities")
    .$type<string[]>()
    .default([]),
  gre_score: integer("gre_score"),
  ielts_score: decimal("ielts_score", { precision: 3, scale: 1 }),
  toefl_score: integer("toefl_score"),
  parent_contact_email: text("parent_contact_email"),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
});

export const risk_scores = pgTable("risk_scores", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  input_snapshot: jsonb("input_snapshot").notNull(),
  placement_prob_3m: decimal("placement_prob_3m", {
    precision: 5,
    scale: 2,
  }),
  placement_prob_6m: decimal("placement_prob_6m", {
    precision: 5,
    scale: 2,
  }),
  placement_prob_12m: decimal("placement_prob_12m", {
    precision: 5,
    scale: 2,
  }),
  salary_band_low_lpa: decimal("salary_band_low_lpa", {
    precision: 6,
    scale: 2,
  }),
  salary_band_high_lpa: decimal("salary_band_high_lpa", {
    precision: 6,
    scale: 2,
  }),
  risk_label: riskLabelEnum("risk_label").notNull(),
  risk_score_raw: decimal("risk_score_raw", { precision: 5, scale: 2 }),
  top_drivers: jsonb("top_drivers").$type<RiskDriver[]>().notNull(),
  next_best_actions: jsonb("next_best_actions")
    .$type<NextBestAction[]>()
    .notNull(),
  ai_summary: text("ai_summary"),
  model_version: text("model_version").default("rule-engine-v1").notNull(),
  calculated_at: timestamp("calculated_at", {
    withTimezone: true,
    mode: "string",
  })
    .defaultNow()
    .notNull(),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
});

export const loan_applications = pgTable("loan_applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  risk_score_id: uuid("risk_score_id").references(() => risk_scores.id),
  status: loanStatusEnum("status").default("draft").notNull(),
  /** Last completed step index (0–7), or -1 before step 0 is finished. */
  step_completed: integer("step_completed").default(-1),
  full_name: text("full_name"),
  dob: date("dob", { mode: "string" }),
  pan_number: text("pan_number"),
  aadhaar_last4: text("aadhaar_last4"),
  address: text("address"),
  institute: text("institute"),
  program: text("program"),
  admission_confirmed: boolean("admission_confirmed").default(false),
  offer_letter_url: text("offer_letter_url"),
  loan_amount_requested: decimal("loan_amount_requested", {
    precision: 12,
    scale: 2,
  }),
  co_borrower_name: text("co_borrower_name"),
  co_borrower_relation: text("co_borrower_relation"),
  collateral_available: boolean("collateral_available").default(false),
  family_income_annual: decimal("family_income_annual", {
    precision: 12,
    scale: 2,
  }),
  documents: jsonb("documents").$type<DocumentRecord[]>().default([]),
  ocr_extracted_data: jsonb("ocr_extracted_data"),
  nbfc_supervisor_id: uuid("nbfc_supervisor_id"),
  nbfc_notes: text("nbfc_notes"),
  nbfc_decision_at: timestamp("nbfc_decision_at", {
    withTimezone: true,
    mode: "string",
  }),
  submitted_at: timestamp("submitted_at", {
    withTimezone: true,
    mode: "string",
  }),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
});

export const user_events = pgTable("user_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  event_type: text("event_type").notNull(),
  event_data: jsonb("event_data"),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
});

export const gamification_rewards = pgTable("gamification_rewards", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  action: text("action").notNull(),
  xp_earned: integer("xp_earned").notNull(),
  badge_unlocked: text("badge_unlocked"),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
});

export const nudge_log = pgTable("nudge_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  nudge_type: text("nudge_type").notNull(),
  channel: text("channel").notNull(),
  content: text("content"),
  sent_at: timestamp("sent_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
  opened: boolean("opened").default(false),
  clicked: boolean("clicked").default(false),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
});
