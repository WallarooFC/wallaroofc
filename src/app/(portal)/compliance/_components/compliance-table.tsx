"use client";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type FilterFn,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CERT_TYPE_LABEL, CERT_TYPE_SHORT } from "@/lib/db/cert-types";
import type { ComplianceListRow } from "@/lib/db/compliance";
import type { CertType } from "@/lib/db/types";

const search: FilterFn<ComplianceListRow> = (row, _id, value) => {
  if (!value) return true;
  const needle = String(value).toLowerCase();
  const hay = [
    row.original.member_name,
    row.original.cert_number ?? "",
    row.original.notes ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(needle);
};

type Filter = "all" | "valid" | "expiring" | "expired" | "missing_expiry";

const FILTER_LABEL: Record<Filter, string> = {
  all: "All",
  valid: "Valid",
  expiring: "Expiring < 30d",
  expired: "Expired",
  missing_expiry: "No expiry set",
};

function bucketFor(expiry: string | null): Exclude<Filter, "all"> {
  if (!expiry) return "missing_expiry";
  const ms = new Date(expiry).getTime() - Date.now();
  const days = Math.round(ms / 86400_000);
  if (days < 0) return "expired";
  if (days <= 30) return "expiring";
  return "valid";
}

function daysLabel(expiry: string | null): {
  text: string;
  tone: "ok" | "warn" | "bad" | "muted";
} {
  if (!expiry) return { text: "no expiry", tone: "muted" };
  const ms = new Date(expiry).getTime() - Date.now();
  const days = Math.round(ms / 86400_000);
  if (days < 0) return { text: `${Math.abs(days)} day${days === -1 ? "" : "s"} ago`, tone: "bad" };
  if (days <= 30) return { text: `in ${days} day${days === 1 ? "" : "s"}`, tone: "warn" };
  if (days <= 60) return { text: `in ${days} days`, tone: "warn" };
  return { text: `in ${days} days`, tone: "ok" };
}

const TONE_PILL: Record<"ok" | "warn" | "bad" | "muted", string> = {
  ok: "bg-wfc-status-green/10 text-wfc-status-green",
  warn: "bg-wfc-status-amber/10 text-wfc-status-amber",
  bad: "bg-wfc-status-red/10 text-wfc-status-red",
  muted: "bg-wfc-grey/15 text-wfc-grey",
};

export function ComplianceTable({ rows }: { rows: ComplianceListRow[] }) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "expiry_date", desc: false },
  ]);
  const [filter, setFilter] = useState<Filter>("all");
  const [searchText, setSearchText] = useState("");

  const filtered = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter((r) => bucketFor(r.expiry_date) === filter);
  }, [rows, filter]);

  const counts = useMemo(() => {
    const base: Record<Filter, number> = {
      all: rows.length,
      valid: 0,
      expiring: 0,
      expired: 0,
      missing_expiry: 0,
    };
    for (const r of rows) base[bucketFor(r.expiry_date)] += 1;
    return base;
  }, [rows]);

  const columns = useMemo<ColumnDef<ComplianceListRow>[]>(
    () => [
      {
        id: "cert_type",
        header: "Cert",
        accessorKey: "cert_type",
        cell: (info) => {
          const t = info.getValue<CertType>();
          return (
            <span className="rounded-full bg-wfc-blue/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-wfc-blue-deep">
              {CERT_TYPE_SHORT[t]}
            </span>
          );
        },
      },
      {
        id: "member_name",
        header: "Holder",
        accessorKey: "member_name",
        cell: ({ row }) => (
          <Link
            href={`/compliance/${row.original.id}` as Route}
            className="text-wfc-blue-deep hover:text-wfc-red"
          >
            {row.original.member_name}
          </Link>
        ),
      },
      {
        id: "cert_number",
        header: "Number",
        accessorKey: "cert_number",
        cell: (info) => (
          <span className="font-mono text-[11px] text-wfc-grey">
            {info.getValue<string | null>() ?? "—"}
          </span>
        ),
      },
      {
        id: "issued_date",
        header: "Issued",
        accessorKey: "issued_date",
        cell: (info) => (
          <span className="font-mono text-[11px] text-wfc-grey">
            {info.getValue<string | null>() ?? "—"}
          </span>
        ),
      },
      {
        id: "expiry_date",
        header: "Expires",
        accessorKey: "expiry_date",
        cell: (info) => (
          <span className="font-mono text-[11px] text-wfc-blue-deep">
            {info.getValue<string | null>() ?? "—"}
          </span>
        ),
      },
      {
        id: "days",
        header: "Status",
        accessorFn: (row) => row.expiry_date,
        cell: ({ row }) => {
          const { text, tone } = daysLabel(row.original.expiry_date);
          return (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]",
                TONE_PILL[tone],
              )}
            >
              {text}
            </span>
          );
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, globalFilter: searchText },
    onSortingChange: setSorting,
    onGlobalFilterChange: setSearchText,
    globalFilterFn: search,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(FILTER_LABEL) as Filter[]).map((key) => {
            const active = filter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em]",
                  active
                    ? "border-wfc-red bg-wfc-red/10 text-wfc-red"
                    : "border-wfc-line bg-white text-wfc-grey hover:border-wfc-blue/40",
                )}
              >
                {FILTER_LABEL[key]}
                <span className="rounded-full bg-wfc-line/50 px-1.5 py-px text-[10px] text-wfc-blue-deep">
                  {counts[key]}
                </span>
              </button>
            );
          })}
        </div>

        <label className="flex items-center gap-2 rounded-md border border-wfc-line bg-white px-3 py-2 text-sm">
          <Search className="h-4 w-4 text-wfc-grey" aria-hidden />
          <Input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search holder or number…"
            className="w-56 border-0 px-0 focus:ring-0"
          />
        </label>
      </div>

      <div className="overflow-x-auto rounded-lg border border-wfc-line bg-white">
        <table className="min-w-full text-left text-sm">
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id} className="border-b border-wfc-line bg-wfc-cream/40">
                {group.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sort = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-wfc-grey"
                    >
                      <button
                        type="button"
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                        className="flex items-center gap-1"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort ? (
                          sort === "asc" ? (
                            <ArrowUp className="h-3 w-3" aria-hidden />
                          ) : sort === "desc" ? (
                            <ArrowDown className="h-3 w-3" aria-hidden />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-40" aria-hidden />
                          )
                        ) : null}
                      </button>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-12 text-center text-sm text-wfc-grey"
                >
                  No compliance records match the filter.{" "}
                  <Link href="/compliance/new" className="font-medium text-wfc-blue-deep underline">
                    Add the first one
                  </Link>
                  .
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-wfc-line last:border-b-0 hover:bg-wfc-cream/40"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-wfc-grey">
        The labels reflect the cert types in {Object.keys(CERT_TYPE_LABEL).length} categories.
      </p>
    </div>
  );
}
