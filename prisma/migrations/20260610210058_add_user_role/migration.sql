-- CreateEnum
CREATE TYPE "Role" AS ENUM ('customer', 'admin', 'guest', 'county', 'contractor');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'customer';
