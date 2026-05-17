/**
 * Bottom strip showing the integration stack & build status -- mirrors the
 * "architecture strip" called out in the build brief. Static metadata; not
 * data-driven.
 */
export function ArchitectureStrip() {
  const items = [
    "Next.js · App Router",
    "Supabase · Postgres + RLS",
    "Resend · email",
    "Twilio · SMS",
    "Vercel · cron",
  ];
  return (
    <footer className="mt-12 border-t border-wfc-line px-6 py-4 font-mono text-[10px] uppercase tracking-[0.18em] text-wfc-grey lg:px-10">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="text-wfc-blue-deep">stack</span>
        {items.map((item, idx) => (
          <span key={item} className="flex items-center gap-3">
            <span>{item}</span>
            {idx < items.length - 1 ? <span aria-hidden className="text-wfc-line">·</span> : null}
          </span>
        ))}
      </div>
    </footer>
  );
}
