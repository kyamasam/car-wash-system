export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex flex-col bg-slate-50 dark:bg-background">
      <header className="px-4 pt-6 sm:px-8">
        <div className="flex items-center gap-2 w-fit">
          <div className="relative w-7 h-7 shrink-0">
            <div className="absolute inset-0 border-2 border-primary rotate-45 rounded-sm" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-sm rotate-45 bg-primary" />
            </div>
          </div>
          <span className="text-[15px] font-black tracking-tight uppercase text-primary/80">
            CarwashManager
          </span>
        </div>
      </header>
      <main className="flex-1 flex items-start sm:items-center justify-center px-4 py-8 sm:px-8">
        <div className="w-full max-w-lg">{children}</div>
      </main>
    </div>
  );
}
