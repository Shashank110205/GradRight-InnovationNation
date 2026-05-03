CREATE TYPE "public"."journey_stage" AS ENUM('discover', 'plan', 'finance', 'apply', 'succeed');--> statement-breakpoint
CREATE TYPE "public"."loan_status" AS ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected', 'manual_review');--> statement-breakpoint
CREATE TYPE "public"."risk_label" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('student', 'nbfc_supervisor', 'admin');--> statement-breakpoint
CREATE TABLE "gamification_rewards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"action" text NOT NULL,
	"xp_earned" integer NOT NULL,
	"badge_unlocked" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loan_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"risk_score_id" uuid,
	"status" "loan_status" DEFAULT 'draft' NOT NULL,
	"step_completed" integer DEFAULT 0,
	"full_name" text,
	"dob" date,
	"pan_number" text,
	"aadhaar_last4" text,
	"address" text,
	"institute" text,
	"program" text,
	"admission_confirmed" boolean DEFAULT false,
	"offer_letter_url" text,
	"loan_amount_requested" numeric(12, 2),
	"co_borrower_name" text,
	"co_borrower_relation" text,
	"collateral_available" boolean DEFAULT false,
	"family_income_annual" numeric(12, 2),
	"documents" jsonb DEFAULT '[]'::jsonb,
	"ocr_extracted_data" jsonb,
	"nbfc_supervisor_id" uuid,
	"nbfc_notes" text,
	"nbfc_decision_at" timestamp with time zone,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nudge_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"nudge_type" text NOT NULL,
	"channel" text NOT NULL,
	"content" text,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"opened" boolean DEFAULT false,
	"clicked" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "risk_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"input_snapshot" jsonb NOT NULL,
	"placement_prob_3m" numeric(5, 2),
	"placement_prob_6m" numeric(5, 2),
	"placement_prob_12m" numeric(5, 2),
	"salary_band_low_lpa" numeric(6, 2),
	"salary_band_high_lpa" numeric(6, 2),
	"risk_label" "risk_label" NOT NULL,
	"risk_score_raw" numeric(5, 2),
	"top_drivers" jsonb NOT NULL,
	"next_best_actions" jsonb NOT NULL,
	"ai_summary" text,
	"model_version" text DEFAULT 'rule-engine-v1' NOT NULL,
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"target_country" text,
	"target_intake" text,
	"degree_type" text,
	"broad_field" text,
	"current_academic_level" text,
	"work_experience_years" integer DEFAULT 0,
	"loan_needed" boolean DEFAULT true,
	"budget_band_usd" text,
	"institute_name" text,
	"institute_tier" text,
	"cgpa" numeric(4, 2),
	"cgpa_scale" numeric(3, 1) DEFAULT '10',
	"internship_count" integer DEFAULT 0,
	"internship_months_total" integer DEFAULT 0,
	"certification_count" integer DEFAULT 0,
	"target_universities" jsonb DEFAULT '[]'::jsonb,
	"gre_score" integer,
	"ielts_score" numeric(3, 1),
	"toefl_score" integer,
	"parent_contact_email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "student_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"event_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supabase_uid" text NOT NULL,
	"email" text NOT NULL,
	"full_name" text,
	"phone" text,
	"role" "user_role" DEFAULT 'student' NOT NULL,
	"consent_given" boolean DEFAULT false NOT NULL,
	"consent_timestamp" timestamp with time zone,
	"onboarding_complete" boolean DEFAULT false NOT NULL,
	"journey_stage" "journey_stage" DEFAULT 'discover' NOT NULL,
	"xp_points" integer DEFAULT 0 NOT NULL,
	"streak_days" integer DEFAULT 0 NOT NULL,
	"last_active_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_supabase_uid_unique" UNIQUE("supabase_uid"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "gamification_rewards" ADD CONSTRAINT "gamification_rewards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_applications" ADD CONSTRAINT "loan_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_applications" ADD CONSTRAINT "loan_applications_risk_score_id_risk_scores_id_fk" FOREIGN KEY ("risk_score_id") REFERENCES "public"."risk_scores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nudge_log" ADD CONSTRAINT "nudge_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_scores" ADD CONSTRAINT "risk_scores_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_events" ADD CONSTRAINT "user_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;