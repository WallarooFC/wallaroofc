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
import type { MemberListRow } from "@/lib/db/members";
import type { MemberType } from "@/lib/db/types";

type FilterKey = "all" | "life" | "playing" | "sponsor" | "vip" | "other";

const FILTER_KEY_BY_TYPE: Record<MemberType, FilterKey> = {
  life: "life",
  senior: "playing",
  junior: "playing",
  gold_sponsor: "sponsor",
  silver_sponsor: "sponsor",
  bronze_sponsor: "sponsor",
  vip: "vip",
  honorary: "other",
  other: "other",
};

const FILTER_LABEL: Record<FilterKey, string> = {
  all: "All",
  life: "Life",
  playing: "Senior + Junior",
  sponsor: "Sponsors",
  vip: "VIP",
  other: "Other",
};

const TYPE_PILL: Record<MemberType, string> = {
  life: "bg-wfc-blue/10 text-wfc-blue-deep",
  senior: "bg-wfc-blue-deep/10 text-wfc-blue-deep",
  junior: "bg-wfc-blue-deep/10 text-wfc-blue-deep",
  gold_sponsor: "bg-wfc-red/10 text-wfc-red",
  silver_sponsor: "bg-wfc-red/10 text-wfc-red",
  bronze_sponsor: "bg-wfc-red/10 text-wfc-red",
  vip: "bg-wfc-status-green/10 text-wfc-status-green",
  honorary: "bg-wfc-grey/15 text-wfc-grey",
  other: "bg-wfc-grey/15 text-wfc-grey",
};

const TYPE_LABEL: Record<MemberType, string> = {
  life: "Life",
  senior: "Senior",
  junior: "Junior",
  gold_sponsor: "Gold",
  silver_sponsor: "Silver",
  bronze_sponsor: "Bronze",
  vip: "VIP",
  honorary: "Honorary",
  other: "Other",
};

const globalSearch: FilterFn<MemberListRow> = (row, _columnId, value) => {
  if (!value) return true;
  const needle = String(value).toLowerCase();
  const hay = [
    row.original.first_name,
    row.original.last_name,
    row.original.member_number ?? "",
    row.original.email ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(needle);
};

export function MembersTable({ rows }: { rows: MemberListRow[] }) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "last_name", desc: false },
  ]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  const filteredRows = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter((r) => FILTER_KEY_BY_TYPE[r.member_type] === filter);
  }, [rows, filter]);

  const counts = useMemo(() => {
    const base: Record<FilterKey, number> = {
      all: rows.length,
      life: 0,
      playing: 0,
      sponsor: 0,
      vip: 0,
      other: 0,
    };
    for (const r of rows) base[FILTER_KEY_BY_TYPE[r.member_type]] += 1;
    return base;
  }, [rows]);

  const columns = useMemo<ColumnDef<MemberListRow>[]>(
    () => [
      {
        id: "member_number",
        header: "Member #",
        accessorFn: (row) => row.member_number ?? "",
        cell: (info) => (
          <span className="font-mono text-[11px] text-wfc-blue-deep">
            {info.getValue<string>() || "—"}
          </span>
        ),
      },
      {
        id: "last_name",
        header: "Name",
        accessorFn: (row) => `${row.last_name}, ${row.first_name}`,
        cell: ({ row }) => (
          <Link
            href={`/members/${row.original.id}` as Route}
            className="text-wfc-blue-deep hover:text-wfc-red"
          >
            {row.original.first_name} {row.original.last_name}
          </Link>
        ),
      },
      {
        id: "member_type",
        header: "Type",
        accessorKey: "member_type",
        cell: (info) => {
          const t = info.getValue<MemberType>();
          return (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]",
                TYPE_PILL[t],
              )}
            >
              {TYPE_LABEL[t]}
            </span>
          );
        },
      },
      {
        id: "email",
        header: "Email",
        accessorKey: "email",
        cell: (info) => (
          <span className="truncate text-xs text-wfc-charcoal">{info.getValue<string | null>() ?? "—"}</span>
        ),
      },
      {
        id: "phone",
        header: "Phone",
        accessorKey: "phone",
        cell: (info) => (
          <span className="font-mono text-[11px] text-wfc-grey">{info.getValue<string | null>() ?? "—"}</span>
        ),
      },
      {
        id: "paid_current_season",
        header: "Paid",
        accessorKey: "paid_current_season",
        cell: (info) => {
          const paid = info.getValue<boolean>();
          return (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]",
                paid
                  ? "bg-wfc-status-green/10 text-wfc-status-green"
                  : "bg-wfc-status-red/10 text-wfc-status-red",
              )}
            >
              {paid ? "Paid" : "Unpaid"}
            </span>
          );
        },
      },
      {
        id: "joined_year",
        header: "Joined",
        accessorKey: "joined_year",
        cell: (info) => (
          <span className="font-mono text-[11px] text-wfc-grey">
            {info.getValue<number | null>() ?? "—"}
          </span>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: filteredRows,
    columns,
    state: { sorting, globalFilter: search },
    onSortingChange: setSorting,
    onGlobalFilterChange: setSearch,
    globalFilterFn: globalSearch,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(FILTER_LABEL) as FilterKey[]).map((key) => {
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
            name="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members…"
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
                        onClick={
                          canSort ? header.column.getToggleSortingHandler() : undefined
                        }
                        className="flex items-center gap-1"
                        aria-label={
                          canSort ? `Sort by ${String(header.column.id)}` : undefined
                        }
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
                  No members match the current filter.
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
    </div>
  );
}
