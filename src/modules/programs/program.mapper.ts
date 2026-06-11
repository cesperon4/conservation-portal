import { decimalToString } from "../../lib/decimal.js";
import type {
  ProgramNameResponse,
  ProgramNameRow,
  ProgramPublicRow,
  ProgramResponse,
} from "./program.schema.js";

export function mapProgramToResponse(row: ProgramPublicRow): ProgramResponse {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    defaultUnitWaterSavings: decimalToString(row.defaultUnitWaterSavings, 2),
    defaultUnitCost: decimalToString(row.defaultUnitCost, 2),
    budget: decimalToString(row.budget, 2),
    defaultUnit: row.defaultUnit,
    singleFamilyHome: row.singleFamilyHome,
    multiFamilyComplex: row.multiFamilyComplex,
    residential: row.residential,
    commercial: row.commercial,
    programStart: row.programStart,
    programEnd: row.programEnd,
    userId: row.userId,
    grantFunding: row.grantFunding,
    thirdParty: row.thirdParty,
    deletedAt: row.deletedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapProgramNameToResponse(
  row: ProgramNameRow,
): ProgramNameResponse {
  return {
    id: row.id,
    name: row.name,
  };
}
