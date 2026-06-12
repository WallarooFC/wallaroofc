import type { Metadata } from "next";

import { CrestMark } from "@/components/brand/CrestMark";

import { EnrolForm } from "./enrol-form";

export const metadata: Metadata = {
  title: "Set up two-factor",
};

export default function EnrolPage() {
  return (
    <div className="border-wfc-line w-full max-w-md rounded-lg border bg-white p-8 shadow-[0_4px_24px_rgba(20,49,92,0.08)]">
      <div className="mb-6 flex items-center gap-3">
        <CrestMark className="h-10 w-10" />
        <div>
          <div className="font-headline text-wfc-grey text-[10px] tracking-[0.22em] uppercase">
            Wallaroo FC · Secretary Portal
          </div>
          <div className="font-display text-wfc-blue-deep text-lg tracking-[0.08em] uppercase">
            Two-factor setup
          </div>
        </div>
      </div>

      <h1 className="text-wfc-blue-deep mb-2 font-serif text-2xl leading-snug font-semibold">
        Add an authenticator app.
      </h1>
      <p className="text-wfc-grey mb-6 text-sm leading-relaxed">
        Scan the QR with Microsoft Authenticator, Authy, or 1Password, then enter the 6-digit code
        to confirm. You&apos;ll only do this once per device.
      </p>

      <EnrolForm />
    </div>
  );
}
