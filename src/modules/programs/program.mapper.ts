import { decimalToString } from "../../lib/decimal.js";
import type {
  ProgramNameResponse,
  ProgramNameRow,
  ProgramPublicRow,
  ProgramResponse,
  ProgramBudgetLogResponse,
  ProgramBudgetLogRow,
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
    userId: row.adminUserId,
    grantFunding: row.grantFunding.toNumber(),
    thirdParty: row.thirdParty,
    deletedAt: row.deletedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapProgramBudgetLogToResponse(
  row: ProgramBudgetLogRow,
): ProgramBudgetLogResponse {
  const previousBudget = row.previousBudget
    ? decimalToString(row.previousBudget, 2)
    : null;
  return {
    id: row.id,
    previousBudget,
    newBudget: decimalToString(row.newBudget, 2),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    programId: row.programId,
    userId: row.adminUserId,
    comment: row.comment,
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
