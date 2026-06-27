import { Body, Container, Head, Html, Preview, Section, Text } from "@react-email/components";
import { format } from "date-fns";

import { BRAND } from "@/lib/brand";

import { LetterheadFooter } from "./components/LetterheadFooter";
import { LetterheadHeader } from "./components/LetterheadHeader";

const wfc = {
  charcoal: "#15171C",
  cream: "#F5F1E8",
  blueDeep: "#0A1F3D",
} as const;

export type SignerRole =
  | "President"
  | "Secretary"
  | "Treasurer"
  | "Vice President"
  | "Committee"
  | (string & {});

export type LetterProps = {
  /** Email subject — also drives the preview text shown in inbox lists. */
  subject: string;
  /** Recipient's name as it should appear in the salutation. */
  recipientName: string;
  /** Date stamped at the top of the letter. Defaults to today. */
  date?: Date;
  /** Sign-off name. Defaults to the Club President. */
  signerName?: string;
  /** Sign-off role. Defaults to "President". */
  signerRole?: SignerRole;
  /** Absolute URL to the crest PNG. Defaults to portal.wallaroofc.com. */
  crestUrl?: string;
  /** Free-form body — only this region is editable per email. */
  children: React.ReactNode;
};

const DEFAULT_CREST_URL = "https://portal.wallaroofc.com/wallaroo-fc-crest.png";

/**
 * The official Wallaroo FC letter template.
 *
 * The header and footer are FIXED — they mirror the print letterhead and
 * are produced by `LetterheadHeader` / `LetterheadFooter`. The body
 * (everything between the date and the sign-off) is free text, supplied
 * by the caller via `children`.
 *
 * Typical use:
 *
 *   <Letter
 *     subject="Your 2026 membership renewal"
 *     recipientName="Jenny Boucher"
 *   >
 *     <Text>Thanks for being part of the club for another season...</Text>
 *     <Text>Your membership for the 2026 season is now due...</Text>
 *   </Letter>
 */
export function Letter({
  subject,
  recipientName,
  date = new Date(),
  signerName = BRAND.president,
  signerRole = "President",
  crestUrl = DEFAULT_CREST_URL,
  children,
}: LetterProps) {
  return (
    <Html lang="en-AU">
      <Head />
      <Preview>{subject}</Preview>
      <Body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: wfc.cream,
          fontFamily: "Arial, sans-serif",
          color: wfc.charcoal,
        }}
      >
        <Container
          style={{
            width: "100%",
            maxWidth: "640px",
            margin: "0 auto",
            backgroundColor: "#FFFFFF",
          }}
        >
          <LetterheadHeader crestUrl={crestUrl} />

          <Section style={{ padding: "32px" }}>
            <Text
              style={{
                margin: 0,
                fontFamily: "Arial, sans-serif",
                fontSize: "12px",
                color: wfc.charcoal,
              }}
            >
              {format(date, "d MMMM yyyy")}
            </Text>

            <Text
              style={{
                margin: "24px 0 0 0",
                fontFamily: "Arial, sans-serif",
                fontSize: "14px",
                fontWeight: 700,
                color: wfc.charcoal,
              }}
            >
              Dear {recipientName},
            </Text>

            {/* === EDITABLE BODY — caller supplies these children === */}
            <Section
              style={{
                marginTop: "16px",
                fontFamily: "Arial, sans-serif",
                fontSize: "14px",
                lineHeight: "1.55",
                color: wfc.charcoal,
              }}
            >
              {children}
            </Section>

            {/* === Sign-off (auto-generated) === */}
            <Section style={{ marginTop: "36px" }}>
              <Text
                style={{
                  margin: 0,
                  fontFamily: "Arial, sans-serif",
                  fontSize: "14px",
                  color: wfc.charcoal,
                }}
              >
                Yours sincerely,
              </Text>
              <Text
                style={{
                  margin: "32px 0 0 0",
                  fontFamily: "'Brush Script MT', cursive",
                  fontSize: "22px",
                  color: wfc.blueDeep,
                }}
              >
                {signerName}
              </Text>
              <div
                style={{
                  height: "1px",
                  width: "120px",
                  marginTop: "6px",
                  backgroundColor: "#C8102E",
                  lineHeight: "1px",
                  fontSize: "0",
                }}
              >
                &nbsp;
              </div>
              <Text
                style={{
                  margin: "8px 0 0 0",
                  fontFamily: "Impact, 'Arial Narrow Bold', sans-serif",
                  fontSize: "13px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: wfc.blueDeep,
                }}
              >
                {signerName}
              </Text>
              <Text
                style={{
                  margin: "2px 0 0 0",
                  fontFamily: "Arial, sans-serif",
                  fontSize: "12px",
                  color: "#C8102E",
                }}
              >
                {signerRole}
              </Text>
              <Text
                style={{
                  margin: "1px 0 0 0",
                  fontFamily: "Arial, sans-serif",
                  fontSize: "12px",
                  color: wfc.charcoal,
                }}
              >
                {BRAND.fullName}
              </Text>
            </Section>
          </Section>

          <LetterheadFooter />
        </Container>
      </Body>
    </Html>
  );
}

export default Letter;
