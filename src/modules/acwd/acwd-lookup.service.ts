import { HttpError, NotFoundError } from "../../lib/errors.js";
import { AcwdRepository } from "./acwd.repository.js";
import {
  buildStreetLine1,
  buildStreetLine2,
  mapAcwdClassToCategory,
  padAccountNo,
  trim,
  zip5,
} from "./address.js";
import type { AcwdLookupPreview } from "./acwd.types.js";

export class AcwdLookupService {
  constructor(private readonly acwd: AcwdRepository) {}

  async lookup(
    accountNo: string,
    postalCode: string,
  ): Promise<AcwdLookupPreview> {
    const paddedAccountNo = padAccountNo(accountNo);
    const billableAccount = await this.acwd.findByAccountNo(paddedAccountNo);
    if (!billableAccount)
      throw new HttpError("Billable account not found", 404);
    if (billableAccount.accountStat !== "BILBL")
      throw new HttpError("Account not billable", 400);

    const current =
      await this.acwd.findLatestMoveInOutByAccount(paddedAccountNo);
    if (!current) throw new HttpError("No active service at this account", 400);
    if (current.status !== "CUTON" || current.moveOutDate !== null) {
      throw new HttpError("No active service at this account", 400);
    }

    const location = await this.acwd.findLocationByNo(current.locationNo);
    if (!location) throw new NotFoundError("Location not found");
    if (trim(location.locationStat) !== "ACT") {
      throw new HttpError("Account not eligible", 400);
    }
    if (zip5(location.postalCode) !== zip5(postalCode)) {
      throw new HttpError("Account number and ZIP do not match", 400);
    }
    const category = mapAcwdClassToCategory(
      location.locationClass,
      billableAccount.accountClass,
    );
    if (category === "other")
      throw new HttpError("Property type is not eligible for rebates", 400);

    return {
      accountNo: paddedAccountNo,
      locationNo: location.locationNo,
      streetLine1: buildStreetLine1(location),
      streetLine2: buildStreetLine2(location),
      city: trim(location.city),
      state: trim(location.provinceCd),
      postalCode: trim(location.postalCode),
      acwdImportedAt: location.importedAt,
      category,
      acwdAccountClass: trim(billableAccount.accountClass ?? undefined) || null,
      acwdLocationClass: trim(location.locationClass ?? undefined) || null,
    };
  }
}
