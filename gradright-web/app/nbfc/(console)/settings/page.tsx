export default function NbfcSettingsPage() {
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-slate-50">
        Settings
      </h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Supervisor preferences and notification routing can be wired here as your
        ops team scales. Decisions are already logged to GradRight&apos;s audit
        trail (<code className="rounded bg-slate-200 px-1 text-xs dark:bg-slate-800">user_events</code>).
      </p>
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">
        <p className="font-medium text-slate-900 dark:text-slate-100">Data notice</p>
        <p className="mt-2">
          This portal reads the same Postgres database as the student experience.
          Row-level security and role checks ensure supervisors only access NBFC
          routes and APIs.
        </p>
      </div>
    </div>
  );
}
