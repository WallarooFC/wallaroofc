/**
 * One-shot renderer: produce a self-contained HTML letterhead Thomas can drop
 * into Outlook's Signatures folder. The body is a placeholder paragraph the
 * sender deletes and replaces.
 *
 * Run:  pnpm tsx scripts/render-outlook-letterhead.tsx
 *       → writes reference/outlook-letterhead.html
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { Text } from "@react-email/components";
import { render } from "@react-email/render";
import React from "react";

import { Letter } from "../src/emails/Letter";

// Reference React so the tsconfig's `jsx: "preserve"` setting works under
// tsx — without this the transform fails with "React is not defined".
void React;

const ROOT = process.cwd();
const CREST_SRC = path.resolve(ROOT, "reference/Wallaroo_Football_Club.png");
const EMBEDDED_TARGET = path.resolve(ROOT, "reference/outlook-letterhead.html");
const HOSTED_TARGET = path.resolve(ROOT, "reference/outlook-letterhead-hosted.html");

async function crestDataUri(): Promise<string> {
  const bytes = await readFile(CREST_SRC);
  return `data:image/png;base64,${bytes.toString("base64")}`;
}

async function renderWithCrest(crestUrl: string, target: string) {
  const html = await render(
    <Letter
      subject="Wallaroo FC correspondence"
      recipientName="[RECIPIENT NAME]"
      crestUrl={crestUrl}
    >
      <Text style={{ margin: "0 0 12px 0", color: "#888" }}>
        [Replace this paragraph with the body of your letter.]
      </Text>
    </Letter>,
    { pretty: true },
  );
  await writeFile(target, html, "utf8");
  console.log(`Wrote ${target} (${html.length} bytes)`);
}

async function main() {
  // Self-contained: crest baked in as base64. Drop into Outlook today,
  // no hosting needed.
  await renderWithCrest(await crestDataUri(), EMBEDDED_TARGET);

  // Hosted: crest fetched from the portal once deployed. Smaller HTML,
  // updates centrally if the crest is ever changed.
  await renderWithCrest("https://portal.wallaroofc.com/wallaroo-fc-crest.png", HOSTED_TARGET);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
