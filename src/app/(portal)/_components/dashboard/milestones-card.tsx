import { getMilestoneCards } from "@/lib/db/queries";

import { Card, CardHeader, EmptyState } from "./card";

function badgeStyle(target: number | null): { bg: string; color: string } {
  if (!target) return { bg: "linear-gradient(135deg, var(--color-wfc-blue), var(--color-wfc-blue-deep))", color: "var(--color-wfc-cream)" };
  if (target >= 200)
    return {
      bg: "radial-gradient(circle at 30% 30%, #f1e3c7, #c89a4a 65%, #7a5a2a)",
      color: "var(--color-wfc-blue-deep)",
    };
  if (target >= 150)
    return {
      bg: "radial-gradient(circle at 30% 30%, #e2e2e2, #a8a8a8 65%, #6a6a6a)",
      color: "var(--color-wfc-blue-deep)",
    };
  if (target >= 100)
    return {
      bg: "radial-gradient(circle at 30% 30%, #d4b896, #b08660 65%, #6e4a2a)",
      color: "#ffffff",
    };
  return {
    bg: "linear-gradient(135deg, var(--color-wfc-blue), var(--color-wfc-blue-deep))",
    color: "var(--color-wfc-cream)",
  };
}

export async function MilestonesCard() {
  const cards = await getMilestoneCards(4);

  return (
    <Card span={4}>
      <CardHeader
        title="Game Milestones"
        subtitle="Auto-counted from PlayHQ match results"
        action="All milestones →"
      />
      {cards.length === 0 ? (
        <EmptyState>
          No imminent milestones — they&apos;ll appear here as the season unfolds.
        </EmptyState>
      ) : (
        <ul className="divide-y divide-dashed divide-wfc-line">
          {cards.map((card) => {
            const style = badgeStyle(card.targetGames);
            return (
              <li
                key={card.id}
                className="grid grid-cols-[56px_1fr_auto] items-center gap-3 py-3"
              >
                <span
                  aria-hidden
                  className="flex h-12 w-12 items-center justify-center rounded-full font-display text-base shadow-[0_2px_6px_rgba(0,0,0,0.16)]"
                  style={{ background: style.bg, color: style.color }}
                >
                  {card.targetGames ?? "—"}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-wfc-blue-deep">
                    {card.playerName}
                  </div>
                  <div className="mt-0.5 truncate text-[11px] text-wfc-grey">
                    {card.matchLabel ?? "Match TBC"}
                    {card.matchDate
                      ? ` · ${new Date(card.matchDate).toLocaleDateString("en-AU", {
                          day: "numeric",
                          month: "short",
                        })}`
                      : ""}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-3 border-t border-wfc-line pt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-wfc-grey">
        Auto-prompts: jumper · presentation · YPCT
      </p>
    </Card>
  );
}
