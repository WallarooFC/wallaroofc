import { Column, Img, Row, Section, Text } from "@react-email/components";

import { BRAND } from "@/lib/brand";

const wfc = {
  red: "#C8102E",
  blue: "#14315C",
  blueDeep: "#0A1F3D",
  charcoal: "#15171C",
  grey: "#595D63",
  white: "#FFFFFF",
} as const;

/**
 * FIXED letterhead header. Do not edit per-email — content here mirrors the
 * print letterhead (reference/wallaroofc-letterhead.jpeg) and must stay
 * consistent across every email the club sends.
 */
export function LetterheadHeader({ crestUrl }: { crestUrl: string }) {
  return (
    <Section
      style={{ paddingTop: "24px", paddingBottom: "0", paddingLeft: "32px", paddingRight: "32px" }}
    >
      <Row>
        {/* Crest */}
        <Column style={{ width: "104px", verticalAlign: "top" }}>
          <Img
            src={crestUrl}
            alt="Wallaroo FC crest"
            width="88"
            height="88"
            style={{ display: "block" }}
          />
        </Column>

        {/* Wordmark + rocker + tagline */}
        <Column style={{ verticalAlign: "top", paddingTop: "4px" }}>
          <Text
            style={{
              margin: 0,
              fontFamily: "Impact, 'Arial Narrow Bold', sans-serif",
              fontSize: "30px",
              letterSpacing: "0.04em",
              color: wfc.blueDeep,
              textTransform: "uppercase",
              lineHeight: "1",
            }}
          >
            Wallaroo
          </Text>
          <Text
            style={{
              margin: 0,
              marginTop: "2px",
              fontFamily: "Impact, 'Arial Narrow Bold', sans-serif",
              fontSize: "22px",
              letterSpacing: "0.12em",
              color: wfc.blueDeep,
              textTransform: "uppercase",
              lineHeight: "1",
            }}
          >
            Football Club
          </Text>
          <Text
            style={{
              margin: 0,
              marginTop: "8px",
              fontFamily: "'Arial Narrow', Arial, sans-serif",
              fontSize: "11px",
              letterSpacing: "0.16em",
              color: wfc.red,
              fontWeight: 700,
            }}
          >
            ─── ESTABLISHED {BRAND.established} ───
          </Text>
          <Text
            style={{
              margin: 0,
              marginTop: "6px",
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontStyle: "italic",
              fontSize: "12px",
              color: wfc.blueDeep,
            }}
          >
            {BRAND.tagline}
          </Text>
        </Column>

        {/* Contact bar */}
        <Column style={{ verticalAlign: "top", textAlign: "right", paddingTop: "4px" }}>
          <Text
            style={{
              margin: 0,
              fontFamily: "Arial, sans-serif",
              fontSize: "11px",
              color: wfc.charcoal,
            }}
          >
            {BRAND.contact.publicSite}
          </Text>
          <Text
            style={{
              margin: "4px 0 0 0",
              fontFamily: "Arial, sans-serif",
              fontSize: "11px",
              color: wfc.charcoal,
            }}
          >
            {BRAND.contact.adminEmail}
          </Text>
          <Text
            style={{
              margin: "10px 0 0 0",
              fontFamily: "Arial, sans-serif",
              fontSize: "11px",
              color: wfc.charcoal,
              lineHeight: "1.4",
            }}
          >
            2B Cornish Terrace
            <br />
            Wallaroo SA 5556
          </Text>
          <Text
            style={{
              margin: "10px 0 0 0",
              paddingTop: "6px",
              borderTop: `1px solid ${wfc.red}`,
              fontFamily: "Arial, sans-serif",
              fontSize: "10px",
              color: wfc.grey,
            }}
          >
            ABN {BRAND.contact.abn}
          </Text>
        </Column>
      </Row>

      {/* Red divider beneath the header band */}
      <Row>
        <Column>
          <div
            style={{
              marginTop: "16px",
              height: "3px",
              backgroundColor: wfc.red,
              lineHeight: "3px",
              fontSize: "0",
            }}
          >
            &nbsp;
          </div>
          <div
            style={{
              height: "1px",
              backgroundColor: wfc.blueDeep,
              marginTop: "2px",
              lineHeight: "1px",
              fontSize: "0",
            }}
          >
            &nbsp;
          </div>
        </Column>
      </Row>
    </Section>
  );
}
