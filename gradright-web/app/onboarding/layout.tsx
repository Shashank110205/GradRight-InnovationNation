export default function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 via-background to-indigo-50/30">
      {children}
    </div>
  );
}
