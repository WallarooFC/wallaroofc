import Link from "next/link";
import type { Route } from "next";

import {
  linkForEntity,
  listActivity,
  listActivityEntityTables,
  pillForAction,
  type ActivityRow,
} from "@/lib/db/activity-log";

export const metadata = { title: "Audit log" };

type SearchParams = Promise<{ entity?: string; page?: string }>;

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { entity, page: pageRaw } = await searchParams;
  const page = Math.max(0, Number(pageRaw ?? "0") || 0);

  const [{ rows, total, pageSize }, entityTables] = await Promise.all([
    listActivity({ page, entity }),
    listActivityEntityTables(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link
          href="/settings"
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-wfc-grey hover:text-wfc-blue-deep"
        >
          ← Settings
        </Link>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.01em] text-wfc-blue-deep">
          Audit log
        </h1>
        <p className="mt-1 text-sm text-wfc-grey">
          {total.toLocaleString("en-AU")} record{total === 1 ? "" : "s"}. Newest first.
        </p>
      </header>

      <nav className="flex flex-wrap gap-1.5">
        <FilterChip label="All entities" href={pageHref({})} active={!entity} />
        {entityTables.map((table) => (
          <FilterChip
            key={table}
            label={table.replace(/_/gu, " ")}
            href={pageHref({ entity: table })}
            active={entity === table}
          />
        ))}
      </nav>

      <section className="overflow-x-auto rounded-lg border border-wfc-line bg-white">
        {rows.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-wfc-grey">
            No activity recorded for the current filter.
          </p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-wfc-line bg-wfc-cream/40 font-mono text-[10px] uppercase tracking-[0.14em] text-wfc-grey">
                <th className="px-3 py-2 font-medium">When</th>
                <th className="px-3 py-2 font-medium">Who</th>
                <th className="px-3 py-2 font-medium">Action</th>
                <th className="px-3 py-2 font-medium">Entity</th>
                <th className="px-3 py-2 font-medium">Diff</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <AuditRow key={row.id} row={row} />
              ))}
            </tbody>
          </table>
        )}
      </section>

      <footer className="flex items-center justify-between text-xs text-wfc-grey">
        <span className="font-mono">
          page {page + 1} of {totalPages}
        </span>
        <span className="flex gap-2">
          {page > 0 ? (
            <Link
              href={pageHref({ entity, page: page - 1 }) as Route}
              className="rounded-md border border-wfc-line px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-wfc-blue-deep hover:bg-wfc-cream"
            >
              ← Newer
            </Link>
          ) : null}
          {page + 1 < totalPages ? (
            <Link
              href={pageHref({ entity, page: page + 1 }) as Route}
              className="rounded-md border border-wfc-line px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-wfc-blue-deep hover:bg-wfc-cream"
            >
              Older →
            </Link>
          ) : null}
        </span>
      </footer>
    </div>
  );
}

function pageHref({
  entity,
  page,
}: {
  entity?: string;
  page?: number;
}): string {
  const params = new URLSearchParams();
  if (entity) params.set("entity", entity);
  if (page && page > 0) params.set("page", String(page));
  const qs = params.toString();
  return `/settings/audit${qs ? `?${qs}` : ""}`;
}

function FilterChip({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href as Route}
      className={[
        "rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em]",
        active
          ? "border-wfc-red bg-wfc-red/10 text-wfc-red"
          : "border-wfc-line bg-white text-wfc-grey hover:border-wfc-blue/40",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

function AuditRow({ row }: { row: ActivityRow }) {
  const target = linkForEntity(row.entity_table, row.entity_id);
  const diffPreview =
    row.diff && typeof row.diff === "object"
      ? JSON.stringify(row.diff)
      : null;

  return (
    <tr className="border-b border-wfc-line last:border-b-0 align-top">
      <td className="px-3 py-2 font-mono text-[11px] text-wfc-grey">
        {new Date(row.at).toLocaleString("en-AU", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </td>
      <td className="px-3 py-2 text-xs text-wfc-blue-deep">
        {row.actor_name ?? (
          <span className="font-mono text-[10px] text-wfc-grey">
            {row.actor ? row.actor.slice(0, 8) : "system"}
          </span>
        )}
      </td>
      <td className="px-3 py-2">
        <span
          className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${pillForAction(row.action)}`}
        >
          {row.action.replace(/_/gu, " ")}
        </span>
      </td>
      <td className="px-3 py-2">
        <span className="font-mono text-[11px] text-wfc-blue-deep">
          {row.entity_table.replace(/_/gu, " ")}
        </span>
        {row.entity_id ? (
          target ? (
            <Link
              href={target as Route}
              className="ml-2 font-mono text-[10px] text-wfc-grey hover:text-wfc-red"
            >
              {row.entity_id.slice(0, 8)}
            </Link>
          ) : (
            <span className="ml-2 font-mono text-[10px] text-wfc-grey">
              {row.entity_id.slice(0, 8)}
            </span>
          )
        ) : null}
      </td>
      <td className="px-3 py-2">
        {diffPreview ? (
          <code className="block max-w-[480px] truncate font-mono text-[10px] text-wfc-grey">
            {diffPreview}
          </code>
        ) : (
          <span className="text-[11px] text-wfc-grey/70">—</span>
        )}
      </td>
    </tr>
  );
}
