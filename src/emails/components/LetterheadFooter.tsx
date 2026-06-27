import { Column, Row, Section, Text } from "@react-email/components";

import { BRAND } from "@/lib/brand";

const wfc = {
  red: "#C8102E",
  blueDeep: "#0A1F3D",
  blueDarkest: "#050E1F",
  cream: "#F5F1E8",
  gold: "#D4A233",
} as const;

/**
 * FIXED letterhead footer. Do not edit per-email — content here mirrors the
 * print letterhead (reference/wallaroofc-letterhead.jpeg).
 */
export function LetterheadFooter() {
  return (
    <Section style={{ marginTop: "40px" }}>
      {/* Red divider */}
      <Row>
        <Column>
          <div
            style={{
              height: "2px",
              backgroundColor: wfc.red,
              lineHeight: "2px",
              fontSize: "0",
            }}
          >
            &nbsp;
          </div>
        </Column>
      </Row>

      {/* Dark band with branding strip */}
      <Section
        style={{
          backgroundColor: wfc.blueDeep,
          padding: "20px 32px",
        }}
      >
        <Row>
          <Column style={{ verticalAlign: "middle", width: "70px" }}>
            <div
              style={{
                width: "54px",
                height: "54px",
                borderRadius: "27px",
                border: `2px solid ${wfc.gold}`,
                textAlign: "center",
                lineHeight: "50px",
                fontFamily: "Georgia, serif",
                fontSize: "16px",
                fontWeight: 700,
                color: wfc.gold,
                letterSpacing: "0.04em",
              }}
            >
              {BRAND.established}
            </div>
          </Column>

          <Column style={{ verticalAlign: "middle", textAlign: "center" }}>
            <Text
              style={{
                margin: 0,
                fontFamily: "Impact, 'Arial Narrow Bold', sans-serif",
                fontSize: "13px",
                letterSpacing: "0.16em",
                color: wfc.cream,
                textTransform: "uppercase",
              }}
            >
              {BRAND.fullName} &nbsp;|&nbsp; {BRAND.contact.affiliation} Affiliated &nbsp;|&nbsp;
              Est. {BRAND.established} &nbsp;|&nbsp; Wallaroo SA
            </Text>
            <Text
              style={{
                margin: "8px 0 0 0",
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontStyle: "italic",
                fontSize: "11px",
                color: wfc.cream,
                opacity: 0.75,
              }}
            >
              {BRAND.footerTagline}
            </Text>
          </Column>

          <Column style={{ verticalAlign: "middle", width: "70px", textAlign: "right" }}>
            <Text
              style={{
                margin: 0,
                fontFamily: "Impact, 'Arial Narrow Bold', sans-serif",
                fontSize: "10px",
                letterSpacing: "0.18em",
                color: wfc.gold,
                textTransform: "uppercase",
              }}
            >
              SANFL
              <br />
              Affiliated
            </Text>
          </Column>
        </Row>
      </Section>
    </Section>
  );
}
