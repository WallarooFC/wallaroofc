export function BrandPanel() {
  return (
    <aside className="relative hidden flex-col justify-between overflow-hidden border-r-4 border-wfc-red bg-gradient-to-br from-wfc-blue via-wfc-blue-deep to-wfc-blue-darkest px-12 py-14 text-wfc-cream lg:flex">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 22%, rgba(200,16,46,0.18), transparent 45%), radial-gradient(circle at 92% 88%, rgba(245,241,232,0.08), transparent 50%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -bottom-16 h-[480px] w-[480px] rounded-full opacity-[0.05]"
        style={{
          background: "radial-gradient(circle, rgba(245,241,232,1) 0%, transparent 70%)",
        }}
      />

      <div className="relative flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-md border border-wfc-cream/30 bg-wfc-blue-darkest/40 font-headline text-2xl tracking-widest text-wfc-cream">
          W
        </div>
        <div className="leading-tight">
          <div className="font-headline text-lg tracking-[0.18em]">WALLAROO FC</div>
          <div className="font-serif text-sm italic text-wfc-cream/80">Secretary Portal</div>
        </div>
      </div>

      <div className="relative max-w-md">
        <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-wfc-cream/55">
          Est. 1888 · Yorke Peninsula
        </p>
        <h1 className="mt-4 font-serif text-4xl font-semibold leading-[1.1] tracking-[-0.01em]">
          The business of the club, <em className="font-serif italic">in one place.</em>
        </h1>
        <p className="mt-5 max-w-sm font-serif text-base leading-relaxed text-wfc-cream/80">
          Members, players, jumpers, milestones, sponsor packs, rosters and minutes — built around
          how the Wallaroo FC Secretary actually works.
        </p>
      </div>

      <div className="relative flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.2em] text-wfc-cream/55">
        <span>v0.2 prototype</span>
        <span>wallaroofc.com.au</span>
      </div>
    </aside>
  );
}
