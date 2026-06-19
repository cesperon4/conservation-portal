import { describe, expect, it } from "vitest";
import type { AcwdLocation } from "../../src/generated/prisma/client.js";
import {
  buildStreetLine1,
  buildStreetLine2,
  mapAcwdClassToCategory,
  padAccountNo,
  trim,
  zip5,
} from "../../src/modules/acwd/address.js";

function location(overrides: Partial<AcwdLocation> = {}): AcwdLocation {
  return {
    locationNo: "9999999901",
    locationStat: "ACT",
    locationClass: "RES",
    houseNo: "123",
    streetPfxDir: null,
    streetName: "MAIN ST",
    streetNmSfx: null,
    streetSfxDir: null,
    secAddrId: null,
    secAddrRange: null,
    city: "FREMONT",
    provinceCd: "CA",
    postalCode: "94536-1234",
    importedAt: new Date("2024-01-01"),
    ...overrides,
  };
}

describe("address helpers", () => {
  it("trim removes surrounding whitespace", () => {
    expect(trim("  hello  ")).toBe("hello");
    expect(trim(undefined)).toBe("");
  });

  it("padAccountNo left-pads to 8 digits", () => {
    expect(padAccountNo("1234567")).toBe("01234567");
    expect(padAccountNo(" 40601154 ")).toBe("40601154");
  });

  it("zip5 compares only the first five digits", () => {
    expect(zip5("94536-1234")).toBe("94536");
    expect(zip5("94536")).toBe("94536");
  });

  it("buildStreetLine1 joins address parts", () => {
    expect(buildStreetLine1(location())).toBe("123 MAIN ST");
    expect(
      buildStreetLine1(
        location({
          streetPfxDir: "N",
          streetNmSfx: "AVE",
          streetSfxDir: "SW",
        }),
      ),
    ).toBe("123 N MAIN ST AVE SW");
  });

  it("buildStreetLine2 returns null when secondary address is absent", () => {
    expect(buildStreetLine2(location())).toBeNull();
    expect(
      buildStreetLine2(location({ secAddrId: "APT", secAddrRange: "2B" })),
    ).toBe("APT 2B");
  });

  it("mapAcwdClassToCategory prefers location class over account class", () => {
    expect(mapAcwdClassToCategory("RES", "COM")).toBe("singleFamilyHome");
    expect(mapAcwdClassToCategory("BUS", "RES")).toBe("commercial");
    expect(mapAcwdClassToCategory(null, "MULTI")).toBe("multiFamilyComplex");
    expect(mapAcwdClassToCategory("HYD", "RES")).toBe("other");
    expect(mapAcwdClassToCategory("RELDS", null)).toBe("landscape");
  });
});
