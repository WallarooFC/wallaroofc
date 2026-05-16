import Link from "next/link";

import { listMembersForVoucher } from "@/lib/db/vouchers";

import { VoucherForm } from "../_components/voucher-form";

export const metadata = { title: "Issue voucher" };

export default async function NewVoucherPage() {
  const members = await listMembersForVoucher();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link
          href="/bar-bulldogs"
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-wfc-grey hover:text-wfc-blue-deep"
        >
          ← Bulldogs $
        </Link>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.01em] text-wfc-blue-deep">
          Issue a voucher
        </h1>
        <p className="mt-1 text-sm text-wfc-grey">
          The portal mints a random 8-character code, generates the QR, and emails the
          recipient if they have an email on file.
        </p>
      </header>
      <VoucherForm members={members} />
    </div>
  );
}
