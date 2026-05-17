import type { HeroPulse } from "@/lib/db/queries";

function formatAud(amount: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function Hero({
  firstName,
  pulse,
  attentionCount,
}: {
  firstName: string;
  pulse: HeroPulse;
  attentionCount: number;
}) {
  const dateLine = new Date().toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <section className="relative overflow-hidden rounded-lg border-b-4 border-wfc-red bg-gradient-to-br from-wfc-blue via-wfc-blue-deep to-wfc-blue-darkest px-7 py-7 text-wfc-cream">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 12% 18%, rgba(200,16,46,0.18), transparent 45%), radial-gradient(circle at 88% 85%, rgba(245,241,232,0.08), transparent 55%)",
        }}
      />
      <div className="relative">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-wfc-cream/65">
          {dateLine}
        </p>
        <h1 className="mt-3 max-w-3xl font-serif text-3xl font-semibold leading-tight tracking-[-0.01em] sm:text-4xl">
          Morning, {firstName} —{" "}
          {attentionCount > 0 ? (
            <em className="italic text-wfc-cream/95">
              {attentionCount} thing{attentionCount === 1 ? "" : "s"} need you today.
            </em>
          ) : (
            <em className="italic text-wfc-cream/95">nothing urgent today.</em>
          )}
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-wfc-cream/80">
          {pulse.pendingAllocations > 0
            ? `${pulse.pendingAllocations} PlayHQ rego email${pulse.pendingAllocations === 1 ? "" : "s"} waiting for a jumper number.`
            : "PlayHQ inbox is empty."}{" "}
          {pulse.bulldogsOutstanding > 0
            ? `${formatAud(pulse.bulldogsOutstanding)} of Bulldogs $ still outstanding.`
            : "Bulldogs $ ledger is clear."}
        </p>

        <div className="mt-7 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
          <PulseStat label="Members 2026" value={pulse.members.toString()} />
          <PulseStat
            label={`Players · ${pulse.players.numbered} numbered`}
            value={pulse.players.total.toString()}
          />
          <PulseStat
            label="PlayHQ rego pending"
            value={pulse.pendingAllocations.toString()}
          />
          <PulseStat label="Gate · YTD" value={formatAud(pulse.gateTakingsYtd)} />
          <PulseStat
            label="Bulldogs $ outstanding"
            value={formatAud(pulse.bulldogsOutstanding)}
          />
        </div>
      </div>
    </section>
  );
}

function PulseStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-display text-3xl leading-none tracking-tight">{value}</div>
      <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-wfc-cream/70">
        {label}
      </div>
    </div>
  );
}
