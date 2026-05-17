"use client";

import { Plus, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";

type Item = { item: string; qty: number };

const STARTERS: Item[] = [
  { item: "Club jersey", qty: 1 },
  { item: "Season pass", qty: 4 },
  { item: "Meal voucher", qty: 6 },
  { item: "Sponsor signage", qty: 1 },
  { item: "Certificate", qty: 1 },
];

export function ContentsEditor({ initial }: { initial: Item[] }) {
  const [items, setItems] = useState<Item[]>(
    initial.length > 0 ? initial : [{ item: "", qty: 1 }],
  );

  const serialized = useMemo(
    () => JSON.stringify(items.filter((i) => i.item.trim() && i.qty >= 1)),
    [items],
  );

  function update(index: number, field: "item" | "qty", value: string) {
    setItems((prev) => {
      const next = prev.slice();
      const row = next[index];
      if (!row) return prev;
      next[index] =
        field === "qty"
          ? { ...row, qty: Math.max(1, Math.trunc(Number(value) || 0)) }
          : { ...row, item: value };
      return next;
    });
  }

  function addRow() {
    setItems((prev) => [...prev, { item: "", qty: 1 }]);
  }

  function removeRow(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function applyStarter() {
    setItems(STARTERS.map((s) => ({ ...s })));
  }

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name="contents" value={serialized} />

      <div className="rounded-md border border-wfc-line">
        <header className="flex items-center justify-between border-b border-wfc-line bg-wfc-cream/40 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-wfc-grey">
          <span>Pack contents · {items.length} item{items.length === 1 ? "" : "s"}</span>
          <button
            type="button"
            onClick={applyStarter}
            className="text-wfc-blue-deep hover:text-wfc-red"
          >
            Apply Gold starter
          </button>
        </header>
        <ul className="divide-y divide-wfc-line">
          {items.map((row, index) => (
            <li
              key={index}
              className="grid grid-cols-[80px_1fr_auto] items-center gap-2 px-3 py-2"
            >
              <Input
                aria-label="Quantity"
                type="number"
                inputMode="numeric"
                min={1}
                max={999}
                value={row.qty}
                onChange={(e) => update(index, "qty", e.target.value)}
                className="text-center"
              />
              <Input
                aria-label="Item"
                value={row.item}
                onChange={(e) => update(index, "item", e.target.value)}
                placeholder="Item description"
              />
              <button
                type="button"
                onClick={() => removeRow(index)}
                aria-label="Remove row"
                className="rounded-md p-2 text-wfc-grey hover:bg-wfc-status-red/10 hover:text-wfc-status-red"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={addRow}
          className="flex w-full items-center justify-center gap-1.5 border-t border-wfc-line px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-wfc-blue-deep hover:bg-wfc-cream/40"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Add item
        </button>
      </div>
    </div>
  );
}
