-- CreateEnum
CREATE TYPE "PropertyCategory" AS ENUM ('singleFamilyHome', 'residential', 'multiFamilyComplex', 'commercial', 'landscape');

-- CreateEnum
CREATE TYPE "PropertySource" AS ENUM ('manual', 'acwd');

-- AlterTable
ALTER TABLE "programs" ADD COLUMN     "landscape" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "customer_user_id" TEXT NOT NULL,
    "street_line_1" VARCHAR(255) NOT NULL,
    "street_line_2" VARCHAR(255),
    "city" VARCHAR(50) NOT NULL,
    "state" VARCHAR(50) NOT NULL,
    "postal_code" VARCHAR(50) NOT NULL,
    "category" "PropertyCategory" NOT NULL,
    "acwd_account_no" VARCHAR(8),
    "acwd_location_no" VARCHAR(10),
    "source" "PropertySource" NOT NULL DEFAULT 'manual',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "properties_customer_user_id_idx" ON "properties"("customer_user_id");

-- CreateIndex
CREATE INDEX "properties_created_at_idx" ON "properties"("created_at");

-- CreateIndex
CREATE INDEX "properties_deleted_at_idx" ON "properties"("deleted_at");

-- CreateIndex
CREATE INDEX "properties_acwd_account_no_idx" ON "properties"("acwd_account_no");

-- CreateIndex
CREATE INDEX "properties_customer_user_id_deleted_at_idx" ON "properties"("customer_user_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "properties_customer_user_id_acwd_account_no_acwd_location_n_key" ON "properties"("customer_user_id", "acwd_account_no", "acwd_location_no");

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_customer_user_id_fkey" FOREIGN KEY ("customer_user_id") REFERENCES "customer_profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
