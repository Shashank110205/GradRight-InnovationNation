# GradRight — Project Setup Guide
# Run these steps EXACTLY in order. Do not skip any step.

---

## Step 1 — Prerequisites (verify before starting)

```bash
node --version    # Must be 20.x or higher
pnpm --version    # Must be 8.x or higher. Install: npm install -g pnpm
python --version  # Must be 3.11 or higher
docker --version  # Required for running risk-service locally
```

---

## Step 2 — Create Next.js Project

```bash
pnpm create next-app@latest gradright-web \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*"

cd gradright-web
```

---

## Step 3 — Install All Dependencies

```bash
# UI + Components
pnpm add @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select
pnpm add class-variance-authority clsx tailwind-merge lucide-react
pnpm dlx shadcn-ui@latest init

# State management
pnpm add zustand @tanstack/react-query

# Forms + validation
pnpm add react-hook-form @hookform/resolvers zod

# AI + Streaming
pnpm add ai @anthropic-ai/sdk

# Database
pnpm add drizzle-orm @supabase/supabase-js @supabase/ssr
pnpm add drizzle-kit --save-dev

# Rate limiting
pnpm add @upstash/ratelimit @upstash/redis

# Email
pnpm add resend

# Charts + Animation
pnpm add recharts framer-motion

# Date + PDF utilities
pnpm add date-fns jspdf html2canvas

# HTTP client
pnpm add axios

# OCR (server-side, development)
pnpm add tesseract.js

# Type utilities
pnpm add --save-dev @types/node
```

---

## Step 4 — Install shadcn/ui Components

```bash
# Run each of these one at a time
pnpm dlx shadcn-ui@latest add button
pnpm dlx shadcn-ui@latest add input
pnpm dlx shadcn-ui@latest add card
pnpm dlx shadcn-ui@latest add dialog
pnpm dlx shadcn-ui@latest add dropdown-menu
pnpm dlx shadcn-ui@latest add select
pnpm dlx shadcn-ui@latest add badge
pnpm dlx shadcn-ui@latest add progress
pnpm dlx shadcn-ui@latest add tabs
pnpm dlx shadcn-ui@latest add toast
pnpm dlx shadcn-ui@latest add skeleton
pnpm dlx shadcn-ui@latest add separator
pnpm dlx shadcn-ui@latest add avatar
pnpm dlx shadcn-ui@latest add alert
pnpm dlx shadcn-ui@latest add sheet
pnpm dlx shadcn-ui@latest add tooltip
```

---

## Step 5 — Environment Variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=        # From Supabase project settings
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # From Supabase project settings
SUPABASE_SERVICE_ROLE_KEY=       # From Supabase project settings (NEVER expose to client)

ANTHROPIC_API_KEY=               # From console.anthropic.com

UPSTASH_REDIS_REST_URL=          # From upstash.com console
UPSTASH_REDIS_REST_TOKEN=        # From upstash.com console

RISK_ENGINE_URL=http://localhost:8000

AWS_ACCESS_KEY_ID=               # For production OCR only, leave blank in dev
AWS_SECRET_ACCESS_KEY=           # For production OCR only, leave blank in dev
AWS_REGION=ap-south-1
AWS_TEXTRACT_BUCKET=             # S3 bucket for Textract processing

RESEND_API_KEY=                  # From resend.com

NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## Step 6 — Supabase Setup

### 6a. Create Supabase project
1. Go to supabase.com → New Project
2. Region: ap-south-1 (Mumbai) — critical for Indian latency
3. Copy URL and keys to .env.local

### 6b. Run Drizzle migrations
```bash
# Generate SQL from schema
pnpm drizzle-kit generate

# Push to Supabase
pnpm drizzle-kit push
```

### 6c. Create Supabase Auth Trigger
Run this in Supabase SQL Editor:
```sql
-- Auto-create public.users record when auth.users record is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (supabase_uid, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### 6d. Create Supabase Storage Buckets
Run in Supabase SQL Editor:
```sql
-- Private bucket for loan documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('loan-documents', 'loan-documents', false);

-- Public bucket for profile assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-assets', 'profile-assets', true);
```

### 6e. Enable RLS + Core Policies
Run in Supabase SQL Editor:
```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE nudge_log ENABLE ROW LEVEL SECURITY;

-- Students can only read/write their own data
CREATE POLICY "student_own_data" ON users
  FOR ALL USING (supabase_uid = auth.uid());

CREATE POLICY "student_own_profile" ON student_profiles
  FOR ALL USING (user_id = (SELECT id FROM users WHERE supabase_uid = auth.uid()));

CREATE POLICY "student_own_risk_scores" ON risk_scores
  FOR ALL USING (user_id = (SELECT id FROM users WHERE supabase_uid = auth.uid()));

CREATE POLICY "student_own_applications" ON loan_applications
  FOR ALL USING (user_id = (SELECT id FROM users WHERE supabase_uid = auth.uid()));

-- NBFC supervisors can read all submitted applications
CREATE POLICY "nbfc_read_submitted_applications" ON loan_applications
  FOR SELECT USING (
    status != 'draft' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE supabase_uid = auth.uid() AND role = 'nbfc_supervisor'
    )
  );

-- NBFC supervisors can update application status only
CREATE POLICY "nbfc_update_application_status" ON loan_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE supabase_uid = auth.uid() AND role = 'nbfc_supervisor'
    )
  )
  WITH CHECK (true);
```

---

## Step 7 — Drizzle Config

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

Add `DATABASE_URL` to `.env.local`:
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
```
(Get this from Supabase: Project Settings → Database → Connection string → URI)

---

## Step 8 — Set Up Risk Engine (Python)

```bash
# From project root
mkdir risk-service && cd risk-service

python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

pip install fastapi uvicorn pydantic numpy pandas scikit-learn python-dotenv
pip freeze > requirements.txt
```

Create `risk-service/main.py` — this is the FastAPI entry point. See `FEATURE_SPECS.md` Module 6 for the complete implementation.

```bash
# Run locally
uvicorn main:app --reload --port 8000
```

Test health:
```bash
curl http://localhost:8000/health
# Expected: {"status": "ok", "version": "rule-engine-v1"}
```

---

## Step 9 — Next.js Config

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000'] },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  // Prevent webpack from bundling server-only modules on client
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false };
    return config;
  },
};

export default nextConfig;
```

---

## Step 10 — Tailwind Config

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // GradRight brand colors
        brand: {
          primary: '#6366F1',    // Indigo — main brand
          secondary: '#8B5CF6',  // Purple — secondary
          accent: '#F59E0B',     // Amber — gamification/XP
          success: '#10B981',    // Emerald — low risk / success
          warning: '#F59E0B',    // Amber — medium risk
          danger: '#EF4444',     // Red — high risk
        },
      },
      borderRadius: {
        lg: '0.625rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

---

## Step 11 — Middleware (Auth Protection)

```typescript
// middleware.ts — at project root
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Redirect unauthenticated users from protected routes
  const protectedRoutes = ['/dashboard', '/loan', '/career', '/financing'];
  const isProtectedRoute = protectedRoutes.some(r => request.nextUrl.pathname.startsWith(r));

  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect authenticated users away from auth pages
  if (['/login', '/signup'].includes(request.nextUrl.pathname) && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // NBFC route protection
  if (request.nextUrl.pathname.startsWith('/nbfc')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    const { data: dbUser } = await supabase
      .from('users')
      .select('role')
      .eq('supabase_uid', user.id)
      .single();

    if (dbUser?.role !== 'nbfc_supervisor') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth).*)'],
};
```

---

## Step 12 — Verify Setup

```bash
# Start Next.js dev server
pnpm dev

# In another terminal, start risk engine
cd risk-service && uvicorn main:app --reload --port 8000

# Verify both are running
curl http://localhost:3000/api/health  # Should return 200
curl http://localhost:8000/health      # Should return {"status": "ok"}
```

---

## Step 13 — Folder Creation Script

Run this to scaffold the full folder structure in one command:

```bash
mkdir -p \
  app/\(auth\)/login \
  app/\(auth\)/signup \
  app/\(dashboard\)/journey \
  app/\(dashboard\)/requirements \
  app/\(dashboard\)/predictor \
  app/\(dashboard\)/career \
  app/\(dashboard\)/financing \
  app/\(dashboard\)/loan \
  app/\(nbfc\)/applications \
  app/\(nbfc\)/portfolio \
  app/\(nbfc\)/settings \
  app/api/ai/chat \
  app/api/ai/risk-score \
  app/api/ai/admission \
  app/api/ai/timeline \
  app/api/ai/digest \
  app/api/loan/application \
  app/api/loan/ocr \
  app/api/loan/eligibility \
  app/api/loan/parent-summary \
  app/api/user/profile \
  app/api/user/onboarding \
  app/api/nbfc/applications \
  app/api/nbfc/portfolio \
  components/ui \
  components/onboarding \
  components/dashboard \
  components/journey \
  components/requirements \
  components/predictor \
  components/career \
  components/financing \
  components/loan \
  components/nbfc \
  components/shared \
  components/layouts \
  lib/db/queries \
  lib/db/migrations \
  lib/ai/prompts \
  lib/ai/risk-engine/data \
  lib/validations \
  lib/utils \
  lib/types \
  stores \
  hooks

echo "Folder structure created."
```
