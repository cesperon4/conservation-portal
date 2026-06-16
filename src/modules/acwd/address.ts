import type { AcwdLocation } from "../../generated/prisma/client.js";

// src/modules/acwd/address.ts
export function trim(value: string | undefined): string {
  return (value ?? "").trim();
}

export function padAccountNo(value: string): string {
  return trim(value).padStart(8, "0");
}

export function buildStreetLine1(location: AcwdLocation): string {
  return [
    location.houseNo,
    location.streetPfxDir,
    location.streetName,
    location.streetNmSfx,
    location.streetSfxDir,
  ]
    .map((part) => trim(part ?? undefined))
    .filter(Boolean)
    .join(" ");
}

export function buildStreetLine2(location: AcwdLocation): string | null {
  return (
    [location.secAddrId, location.secAddrRange]
      .map((part) => part?.trim() || undefined)
      .filter(Boolean)
      .join(" ") || null
  );
}

export function zip5(postalCode: string): string {
  return trim(postalCode).split("-")[0] ?? "";
}

const AcwdClassToCategoryMap = {
  res: "singleFamilyHome",
  resrt: "residential",
  multi: "multiFamilyComplex",
  bus: "commercial",
  ind: "commercial",
  hyd: "other",
  relds: "landscape",
  xlds: "landscape",
  bulds: "commercial",
  inlds: "other",
  wind: "commercial",
  munit: "other",
  wagri: "other",
  wmuni: "other",
  medic: "commercial",
  mja: "other",
  wjuse: "other",
  wtule: "other",
  nocol: "other",
} as const;

type AcwdClassCode = keyof typeof AcwdClassToCategoryMap;
type MappedCategory = (typeof AcwdClassToCategoryMap)[AcwdClassCode];

export function lookupAcwdClass(
  code: string | null | undefined,
): MappedCategory | undefined {
  const key = trim(code ?? undefined).toLowerCase();
  if (key in AcwdClassToCategoryMap) {
    return AcwdClassToCategoryMap[key as AcwdClassCode];
  }
  return undefined;
}

export function mapAcwdClassToCategory(
  locationClass: string | null,
  accountClass: string | null,
): MappedCategory {
  return (
    lookupAcwdClass(locationClass) ?? lookupAcwdClass(accountClass) ?? "other"
  );
}
