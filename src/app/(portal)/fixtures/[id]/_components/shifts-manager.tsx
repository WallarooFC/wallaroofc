import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CheckboxRow } from "@/components/ui/checkbox-row";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  ROSTER_ROLE_LABEL,
  ROSTER_ROLE_OPTIONS,
  ROSTER_STATUS_OPTIONS,
  shiftFillStatus,
  type MemberPick,
  type ShiftWithAssignments,
} from "@/lib/db/fixtures";

import { addAssignment, createShift } from "../../actions";

import { AssignmentRow } from "./assignment-row";
import { DeleteShiftButton } from "./delete-shift-button";

const STATUS_PILL = {
  filled: "bg-wfc-status-green/15 text-wfc-status-green",
  partial: "bg-wfc-status-amber/15 text-wfc-status-amber",
  empty: "bg-wfc-status-red/15 text-wfc-status-red",
} as const;

const STATUS_LABEL = {
  filled: "Filled",
  partial: "Partial",
  empty: "Unfilled",
} as const;

function timeRange(shift: ShiftWithAssignments): string {
  if (shift.start_time && shift.end_time) return `${shift.start_time}–${shift.end_time}`;
  if (shift.start_time) return `from ${shift.start_time}`;
  return "all day";
}

export function ShiftsManager({
  fixtureId,
  shifts,
  members,
}: {
  fixtureId: string;
  shifts: ShiftWithAssignments[];
  members: MemberPick[];
}) {
  const createShiftAction = createShift.bind(null, fixtureId);

  return (
    <section className="rounded-lg border border-wfc-line bg-white">
      <header className="flex items-center justify-between border-b border-wfc-line px-5 py-3">
        <div>
          <h2 className="font-serif text-base font-semibold text-wfc-blue-deep">Roster</h2>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-wfc-grey">
            {shifts.length} shift{shifts.length === 1 ? "" : "s"}
          </p>
        </div>
      </header>

      {shifts.length === 0 ? (
        <p className="px-5 py-6 text-center text-sm text-wfc-grey">
          No shifts configured. Add one below to start building the match-day roster.
        </p>
      ) : (
        <ul className="divide-y divide-wfc-line">
          {shifts.map((shift) => {
            const fill = shiftFillStatus(shift);
            const confirmed = shift.assignments.filter((a) => a.status === "confirmed").length;
            const addAssignmentAction = addAssignment.bind(null, fixtureId, shift.id);

            return (
              <li key={shift.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-wfc-blue-deep">
                      {ROSTER_ROLE_LABEL[shift.role]}
                      <span
                        className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${STATUS_PILL[fill]}`}
                      >
                        {STATUS_LABEL[fill]} · {confirmed}/{shift.slots_required}
                      </span>
                    </h3>
                    <p className="mt-1 font-mono text-[11px] text-wfc-grey">
                      {timeRange(shift)}
                      {shift.requires_rsa ? " · RSA req'd" : ""}
                      {shift.requires_first_aid ? " · First aid req'd" : ""}
                    </p>
                    {shift.notes ? (
                      <p className="mt-1 text-[11px] text-wfc-grey">{shift.notes}</p>
                    ) : null}
                  </div>
                  <DeleteShiftButton
                    fixtureId={fixtureId}
                    shiftId={shift.id}
                    shiftLabel={ROSTER_ROLE_LABEL[shift.role]}
                  />
                </div>

                {shift.assignments.length > 0 ? (
                  <ul className="mt-3 rounded-md border border-wfc-line bg-wfc-cream/30 px-3">
                    {shift.assignments.map((a) => (
                      <AssignmentRow
                        key={a.id}
                        fixtureId={fixtureId}
                        assignmentId={a.id}
                        memberName={a.member_name}
                        status={a.status}
                      />
                    ))}
                  </ul>
                ) : null}

                <form
                  action={addAssignmentAction}
                  className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_160px_auto]"
                >
                  <Select name="member_id" defaultValue="" required>
                    <option value="" disabled>
                      Add member…
                    </option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.last_name}, {m.first_name}
                        {m.member_number ? ` · ${m.member_number}` : ""}
                      </option>
                    ))}
                  </Select>
                  <Select name="status" defaultValue="invited">
                    {ROSTER_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                  <Button type="submit" variant="secondary" size="md">
                    <Plus className="h-4 w-4" aria-hidden />
                    Assign
                  </Button>
                </form>
              </li>
            );
          })}
        </ul>
      )}

      {/* Add shift form */}
      <details className="border-t border-wfc-line">
        <summary className="cursor-pointer bg-wfc-cream/40 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-wfc-blue-deep hover:bg-wfc-cream">
          + Add a shift
        </summary>
        <form action={createShiftAction} className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="role">Role</Label>
            <Select name="role" defaultValue="">
              <option value="" disabled>
                Pick a role
              </option>
              {ROSTER_ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="slots_required">Slots required</Label>
            <Input name="slots_required" type="number" inputMode="numeric" min={1} max={20} defaultValue={1} />
          </div>
          <div>
            <Label htmlFor="start_time">Start</Label>
            <Input name="start_time" type="time" />
          </div>
          <div>
            <Label htmlFor="end_time">End</Label>
            <Input name="end_time" type="time" />
          </div>
          <CheckboxRow
            name="requires_rsa"
            label="RSA required"
            description="Bar shifts must have at least one RSA holder."
          />
          <CheckboxRow
            name="requires_first_aid"
            label="First aid required"
            description="Match-day medical cover."
          />
          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit">
              <Plus className="h-4 w-4" aria-hidden />
              Add shift
            </Button>
          </div>
        </form>
      </details>
    </section>
  );
}
