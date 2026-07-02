import { describe, expect, it } from "vitest";

import { createTemplateSchema, expectedBodyKind, templateBodySchema } from "./types";

describe("template body schemas", () => {
  it("accepts a well-formed social body", () => {
    const result = templateBodySchema.safeParse({
      kind: "social",
      text: "Come along on Saturday!",
      hashtags: ["#WallarooFC"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a takeover body missing the heading", () => {
    const result = templateBodySchema.safeParse({
      kind: "takeover",
      heading: "",
      body: "text",
    });
    expect(result.success).toBe(false);
  });
});

describe("category ↔ body kind mapping", () => {
  it("routes social categories to the social body", () => {
    expect(expectedBodyKind("social_facebook")).toBe("social");
    expect(expectedBodyKind("social_instagram")).toBe("social");
  });
  it("routes admin_letter to letter", () => {
    expect(expectedBodyKind("admin_letter")).toBe("letter");
  });
  it("routes landing_takeover to takeover", () => {
    expect(expectedBodyKind("landing_takeover")).toBe("takeover");
  });
});

describe("createTemplateSchema", () => {
  it("rejects a template whose body kind doesn't match its category", () => {
    const result = createTemplateSchema.safeParse({
      title: "Broken",
      category: "social_facebook",
      body: { kind: "takeover", heading: "H", body: "B", ctaLabel: null, ctaUrl: null },
      imagePath: null,
    });
    expect(result.success).toBe(false);
  });

  it("accepts a matching category + body pair", () => {
    const result = createTemplateSchema.safeParse({
      title: "Game reminder",
      category: "social_facebook",
      body: { kind: "social", text: "Home game 2pm.", hashtags: [] },
      imagePath: null,
    });
    expect(result.success).toBe(true);
  });
});
