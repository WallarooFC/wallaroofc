export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[1400px] flex-col items-start gap-6 px-8 py-20">
      <p className="font-headline text-wfc-red text-sm tracking-[0.35em] uppercase">
        Wallaroo Football Club
      </p>
      <h1 className="font-display text-wfc-blue-deep text-6xl leading-[0.95] uppercase sm:text-7xl">
        Secretary Portal
      </h1>
      <p className="text-wfc-charcoal max-w-2xl font-serif text-lg">
        Scaffold ready. Sign-in, dashboard, and data layers land in the next commits.
      </p>
      <div className="mt-2 flex flex-wrap gap-3">
        <span className="bg-wfc-status-green/10 font-headline text-wfc-status-green rounded-full px-3 py-1 text-xs tracking-widest uppercase">
          OK
        </span>
        <span className="bg-wfc-status-amber/10 font-headline text-wfc-status-amber rounded-full px-3 py-1 text-xs tracking-widest uppercase">
          Warn
        </span>
        <span className="bg-wfc-status-red/10 font-headline text-wfc-status-red rounded-full px-3 py-1 text-xs tracking-widest uppercase">
          Bad
        </span>
      </div>
    </main>
  );
}
