"use client";

import { Loader2, Plus, X } from "lucide-react";
import { useRef, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  ACTION_STATUS_OPTIONS,
  ACTION_STATUS_PILL,
} from "@/lib/db/agenda-types";
import type { ActionItemRow, ActionItemStatus } from "@/lib/db/types";

import {
  addActionItem,
  deleteActionItem,
  setActionStatus,
} from "../../actions";

export function ActionItemsManager({
  agendaId,
  items,
}: {
  agendaId: string;
  items: ActionItemRow[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const addAction = addActionItem.bind(null, agendaId);

  function handleAdd(formData: FormData) {
    void addAction(formData);
    formRef.current?.reset();
  }

  return (
    <section className="rounded-lg border border-wfc-line bg-white p-5">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-base font-semibold text-wfc-blue-deep">
          Action items
        </h2>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-wfc-grey">
          {items.length} total · {items.filter((i) => i.status === "open" || i.status === "in_progress").length} open
        </p>
      </header>

      {items.length === 0 ? (
        <p className="rounded-md border border-dashed border-wfc-line bg-wfc-cream/40 px-4 py-6 text-center text-sm text-wfc-grey">
          No action items yet.
        </p>
      ) : (
        <ul className="mb-4 divide-y divide-wfc-line">
          {items.map((item) => (
            <ActionRow key={item.id} agendaId={agendaId} item={item} />
          ))}
        </ul>
      )}

      <form
        ref={formRef}
        action={handleAdd}
        className="grid grid-cols-1 gap-2 rounded-md border border-wfc-line bg-wfc-cream/30 p-3 sm:grid-cols-[1fr_140px_160px_auto]"
      >
        <Input name="description" placeholder="Action description" required />
        <Input name="due_date" type="date" />
        <Select name="status" defaultValue="open">
          {ACTION_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="secondary">
          <Plus className="h-4 w-4" aria-hidden />
          Add
        </Button>
      </form>
    </section>
  );
}

function ActionRow({
  agendaId,
  item,
}: {
  agendaId: string;
  item: ActionItemRow;
}) {
  const [pending, startTransition] = useTransition();

  function onStatus(next: ActionItemStatus) {
    startTransition(async () => {
      await setActionStatus(agendaId, item.id, next);
    });
  }

  function onDelete() {
    if (!window.confirm("Delete this action item?")) return;
    startTransition(async () => {
      await deleteActionItem(agendaId, item.id);
    });
  }

  return (
    <li className="grid grid-cols-[1fr_120px_140px_auto] items-center gap-3 py-2">
      <div>
        <div className="text-sm text-wfc-blue-deep">{item.description}</div>
        {item.due_date ? (
          <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-wfc-grey">
            Due {new Date(item.due_date).toLocaleDateString("en-AU")}
          </div>
        ) : null}
      </div>
      <span
        className={`justify-self-start rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${ACTION_STATUS_PILL[item.status]}`}
      >
        {item.status.replace("_", " ")}
      </span>
      <Select
        className="h-9 text-xs"
        defaultValue={item.status}
        disabled={pending}
        onChange={(e) => onStatus(e.target.value as ActionItemStatus)}
      >
        {ACTION_STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        className="rounded-md p-2 text-wfc-grey hover:bg-wfc-status-red/10 hover:text-wfc-status-red"
        aria-label="Delete action item"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <X className="h-4 w-4" aria-hidden />}
      </button>
    </li>
  );
}
