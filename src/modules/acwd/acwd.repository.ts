import type { PrismaClient } from "../../generated/prisma/client.js";

export class AcwdRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findByAccountNo(accountNo: string) {
    return this.prisma.acwdAccount.findUnique({
      where: { accountNo },
    });
  }

  findLatestMoveInOutByAccount(accountNo: string) {
    return this.prisma.acwdMoveInOut.findFirst({
      where: { accountNo },
      orderBy: [{ statusDate: "desc" }, { moveInDate: "desc" }, { id: "desc" }],
    });
  }

  findLocationByNo(locationNo: string) {
    return this.prisma.acwdLocation.findUnique({
      where: { locationNo },
    });
  }
}
