import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/env", () => ({
  env: { ALLOW_LIST_EMAILS: "secretary@wallaroofc.com.au, president@wallaroofc.com.au" },
}));

describe("isEmailAllowed", () => {
  let isEmailAllowed: (email: string) => boolean;

  beforeEach(async () => {
    ({ isEmailAllowed } = await import("./allow-list"));
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("matches an allow-listed email exactly", () => {
    expect(isEmailAllowed("secretary@wallaroofc.com.au")).toBe(true);
  });

  it("is case-insensitive and trims whitespace", () => {
    expect(isEmailAllowed("  Secretary@Wallaroofc.Com.AU  ")).toBe(true);
  });

  it("rejects emails not on the list", () => {
    expect(isEmailAllowed("stranger@example.com")).toBe(false);
  });

  it("rejects empty input", () => {
    expect(isEmailAllowed("")).toBe(false);
    expect(isEmailAllowed("   ")).toBe(false);
  });
});
