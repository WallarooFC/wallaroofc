import Link from "next/link";

import { MemberForm } from "../_components/member-form";

export const metadata = { title: "New member" };

export default function NewMemberPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link
          href="/members"
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-wfc-grey hover:text-wfc-blue-deep"
        >
          ← Members
        </Link>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.01em] text-wfc-blue-deep">
          New member
        </h1>
        <p className="mt-1 text-sm text-wfc-grey">
          The PlayHQ inbox creates senior + reserves players automatically; use this form for
          sponsors, life members, and anyone who didn&apos;t come through PlayHQ.
        </p>
      </header>

      <MemberForm />
    </div>
  );
}
