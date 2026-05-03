# UI system architecture

## Layers

1. **Design primitives** — `gradright-web/components/ui/` (shadcn-style), `gradright-web/components/shell/` (GlassCard, ScoreRing, …). No product business rules.
2. **Cross-cutting shell** — `gradright-web/components/shared/` (AppProviders, AppUserMenu, ChatbotToggle, JourneyBar). No domain-specific loan/admission logic.
3. **Student product** — `gradright-web/components/student/**` — all authenticated student journey surfaces (auth forms, onboarding, hub, modules).
4. **Partner product** — `gradright-web/components/partner/**` — NBFC console + partner auth forms.

## Rule

> If a component encodes **student** or **partner** business rules, it **must not** live in `shared/`, `ui/`, or `shell/`.

## Naming

- PascalCase component files.
- Folders: `student`, `partner`, `shared`, `ui`, `shell`.

## Imports

Prefer `@/components/student/...` and `@/components/partner/...` for product code; never reintroduce top-level `components/auth`, `components/nbfc`, or `components/admission`.
