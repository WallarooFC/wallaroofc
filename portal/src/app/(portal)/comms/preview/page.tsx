import { Text } from "@react-email/components";
import type { Metadata } from "next";

import { Letter } from "@/emails/Letter";

export const metadata: Metadata = {
  title: "Letter preview",
};

/**
 * Visual preview of the locked letterhead template. The body region between
 * the salutation and the sign-off is the ONLY editable area per email; every
 * other element comes from <Letter>, <LetterheadHeader>, and
 * <LetterheadFooter> and stays consistent across the club's correspondence.
 *
 * Wrapping the email tree in a plain div is fine for a browser preview —
 * @react-email/components are just React components with inline styles.
 * The same tree, run through `renderEmail()` in lib/email/render.ts, is what
 * gets emailed via Resend.
 */
export default function LetterPreviewPage() {
  return (
    <main className="mx-auto flex max-w-[1100px] flex-col gap-6 px-8 py-12">
      <div>
        <p className="font-headline text-wfc-red text-xs tracking-[0.3em] uppercase">
          Email template
        </p>
        <h1 className="font-display text-wfc-blue-deep text-4xl tracking-tight uppercase">
          Wallaroo FC Letter
        </h1>
        <p className="text-wfc-charcoal mt-2 max-w-2xl font-serif text-base">
          The header and footer are fixed and shared across every email the club sends. Each
          template (membership reminder, jumper confirmation, roster invite, etc.) only changes what
          sits between the salutation and the sign-off.
        </p>
      </div>

      <div className="border-wfc-line bg-wfc-grey/10 rounded-lg border p-6 shadow-[0_4px_24px_rgba(20,49,92,0.08)]">
        <Letter subject="Your 2026 membership renewal is due" recipientName="Jenny Boucher">
          <Text style={{ margin: "0 0 12px 0" }}>
            Thanks for being part of the club for another season — we&apos;re looking forward to
            seeing you at the home opener against Kadina on 12 April.
          </Text>
          <Text style={{ margin: "0 0 12px 0" }}>
            Your <strong>2026 membership of $120</strong> hasn&apos;t come through yet. A quick tap
            on the link below squares it away in under a minute:
          </Text>
          <Text style={{ margin: "0 0 12px 0" }}>
            <a href="https://wallaroofc.com" style={{ color: "#C8102E" }}>
              Renew online
            </a>
            &nbsp;·&nbsp;or reply to this email and I&apos;ll mark it as paid on the next round.
          </Text>
          <Text style={{ margin: 0 }}>
            If anything&apos;s changed at your end — address, contact, the usual — let me know and
            I&apos;ll update the records.
          </Text>
        </Letter>
      </div>
    </main>
  );
}
