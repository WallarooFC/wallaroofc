import { describe, expect, it } from "vitest";

import {
  isMissing,
  parseDob,
  parseEmail,
  parseMemberType,
  parseMembershipNumber,
  parsePhone,
  parseSquad,
  parseYearInGrade,
  splitFullName,
  trainerLevelToCertType,
} from "./parse";

describe("isMissing", () => {
  it.each(["", "  ", "N/A", "n/a", "NA", "-", null, undefined])("treats %p as missing", (raw) => {
    expect(isMissing(raw)).toBe(true);
  });
  it("treats real strings as present", () => {
    expect(isMissing("hello")).toBe(false);
    expect(isMissing("0")).toBe(false);
  });
});

describe("splitFullName", () => {
  it("strips honorific and trims trailing space", () => {
    expect(splitFullName("Mrs June Schofield ")).toEqual({
      firstName: "June",
      lastName: "Schofield",
    });
  });
  it("keeps multi-token first names", () => {
    expect(splitFullName("St Mary Mackillop")).toEqual({
      firstName: "St Mary",
      lastName: "Mackillop",
    });
  });
  it("flags single-token names", () => {
    const result = splitFullName("Madonna");
    expect(result.firstName).toBe("Madonna");
    expect(result.lastName).toBe("(unknown)");
    expect(result.flag?.field).toBe("name");
  });
  it("flags missing", () => {
    expect(splitFullName("N/A").flag?.reason).toMatch(/missing/u);
  });
});

describe("parseMemberType", () => {
  it.each([
    ["Life Member", "life"],
    ["Gold Sponsor", "gold_sponsor"],
    ["Gold", "gold_sponsor"],
    ["Bronze", "bronze_sponsor"],
    ["Honorary", "honorary"],
  ])("maps %s -> %s", (raw, expected) => {
    expect(parseMemberType(raw).type).toBe(expected);
  });
  it("flags unknowns as 'other'", () => {
    const r = parseMemberType("Special Friend");
    expect(r.type).toBe("other");
    expect(r.flag?.field).toBe("member_type");
  });
});

describe("parseSquad", () => {
  it.each([
    ["SNR Colts", "snr_colts"],
    ["JNR Colts", "jnr_colts"],
    ["Under 11s", "u11s"],
    ["Under 9s", "u9s"],
    ["Seniors", "seniors"],
    ["A Grade", "seniors"],
  ])("maps %s -> %s", (raw, expected) => {
    const r = parseSquad(raw);
    expect("squad" in r ? r.squad : undefined).toBe(expected);
  });
  it("flags unknowns", () => {
    const r = parseSquad("Veterans") as { flag: { reason: string } };
    expect(r.flag.reason).toMatch(/unknown/u);
  });
});

describe("parseYearInGrade", () => {
  it.each([
    ["First Year", "first"],
    ["Middle Year", "middle"],
    ["Last Year", "last"],
    ["Last Year (Exempt)", "last_exempt"],
  ])("maps %s -> %s", (raw, expected) => {
    expect(parseYearInGrade(raw).year).toBe(expected);
  });
  it("returns null and flag for unknowns", () => {
    const r = parseYearInGrade("Halfway");
    expect(r.year).toBeNull();
    expect(r.flag?.field).toBe("year_in_grade");
  });
});

describe("parseDob", () => {
  it("parses M/D/YY into ISO", () => {
    expect(parseDob("5/20/10").iso).toBe("2010-05-20");
  });
  it("zero-pads single digit components", () => {
    expect(parseDob("1/2/17").iso).toBe("2017-01-02");
  });
  it("flags garbage", () => {
    const r = parseDob("yesterday");
    expect(r.iso).toBeNull();
    expect(r.flag?.field).toBe("dob");
  });
  it("flags out-of-range", () => {
    const r = parseDob("13/40/10");
    expect(r.iso).toBeNull();
    expect(r.flag?.reason).toMatch(/range/u);
  });
});

describe("parsePhone", () => {
  it("normalises mobile with spaces", () => {
    expect(parsePhone("0409 428 977").e164).toBe("+61409428977");
  });
  it("normalises a landline without the leading 0", () => {
    expect(parsePhone("888215800").e164).toBe("+61888215800");
  });
  it("flags ambiguous 8-digit numbers", () => {
    expect(parsePhone("88215800").flag?.field).toBe("phone");
  });
  it("keeps +61 numbers", () => {
    expect(parsePhone("+61 412 345 678").e164).toBe("+61412345678");
  });
  it("flags nonsense", () => {
    expect(parsePhone("call me").flag?.field).toBe("phone");
  });
});

describe("parseEmail", () => {
  it("lowercases and trims", () => {
    expect(parseEmail(" Test@Foo.com ").email).toBe("test@foo.com");
  });
  it("returns null for N/A", () => {
    expect(parseEmail("N/A").email).toBeNull();
  });
  it("flags malformed", () => {
    expect(parseEmail("not-an-email").flag?.field).toBe("email");
  });
});

describe("parseMembershipNumber", () => {
  it("passes through a single number", () => {
    const r = parseMembershipNumber("82");
    expect(r.number).toBe("82");
    expect(r.extras).toEqual([]);
  });
  it("splits a comma list, keeps the first, flags the rest", () => {
    const r = parseMembershipNumber("61, 62, 295");
    expect(r.number).toBe("61");
    expect(r.extras).toEqual(["62", "295"]);
    expect(r.flag?.reason).toMatch(/multiple/u);
  });
  it("flags N/A", () => {
    const r = parseMembershipNumber("N/A");
    expect(r.number).toBeNull();
    expect(r.flag?.reason).toMatch(/N\/A/u);
  });
});

describe("trainerLevelToCertType", () => {
  it.each([
    ["Level 0", "trainer_level_0"],
    ["Level 1", "trainer_level_1"],
    ["Level 2", "trainer_level_2"],
    ["", "trainer_level_0"],
  ])("maps %s -> %s", (raw, expected) => {
    expect(trainerLevelToCertType(raw)).toBe(expected);
  });
});
