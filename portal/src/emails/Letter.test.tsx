import { render } from "@react-email/render";
import { describe, expect, it } from "vitest";

import { BRAND } from "@/lib/brand";

import { Letter } from "./Letter";

async function renderLetterToHtml(node: React.ReactElement) {
  const html = await render(node, { pretty: false });
  // React inserts <!-- --> markers between adjacent text fragments. Strip
  // them so test matches read against the visible content.
  return html.replace(/<!--[\s\S]*?-->/g, "");
}

describe("Letter", () => {
  it("renders the fixed header content", async () => {
    const html = await renderLetterToHtml(
      <Letter subject="Test subject" recipientName="Jenny" date={new Date("2026-06-27T00:00:00Z")}>
        <p>body</p>
      </Letter>,
    );
    expect(html).toContain("Wallaroo");
    expect(html).toContain("Football Club");
    expect(html).toContain(String(BRAND.established));
    expect(html).toContain(BRAND.contact.adminEmail);
    expect(html).toContain(BRAND.contact.publicSite);
  });

  it("renders the fixed footer content", async () => {
    const html = await renderLetterToHtml(
      <Letter subject="Test" recipientName="Jenny">
        <p>body</p>
      </Letter>,
    );
    expect(html).toContain(BRAND.footerTagline);
    expect(html).toContain("SANFL");
  });

  it("renders the salutation, date, and sign-off automatically", async () => {
    const html = await renderLetterToHtml(
      <Letter subject="Test" recipientName="Jenny Boucher" date={new Date("2026-06-27T00:00:00Z")}>
        <p>body</p>
      </Letter>,
    );
    expect(html).toContain("Dear Jenny Boucher,");
    expect(html).toContain("Yours sincerely,");
    expect(html).toContain(BRAND.president);
    expect(html).toMatch(/2[67] June 2026/);
  });

  it("renders the body content the caller supplies", async () => {
    const html = await renderLetterToHtml(
      <Letter subject="Test" recipientName="Jenny">
        <p>This is the free-form body for one specific email.</p>
      </Letter>,
    );
    expect(html).toContain("This is the free-form body for one specific email.");
  });

  it("honours signer overrides", async () => {
    const html = await renderLetterToHtml(
      <Letter
        subject="Test"
        recipientName="Jenny"
        signerName="Thomas Depledge"
        signerRole="Secretary"
      >
        <p>body</p>
      </Letter>,
    );
    expect(html).toContain("Thomas Depledge");
    expect(html).toContain("Secretary");
  });
});
