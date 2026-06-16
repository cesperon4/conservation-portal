-- CreateEnum
CREATE TYPE "AcwdImportStatus" AS ENUM ('running', 'success', 'failed');

-- CreateTable
CREATE TABLE "acwd_accounts" (
    "account_no" VARCHAR(8) NOT NULL,
    "account_stat" VARCHAR(5),
    "account_class" VARCHAR(10),
    "person_no" VARCHAR(10) NOT NULL,
    "addr_seq_default" SMALLINT,
    "imported_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acwd_accounts_pkey" PRIMARY KEY ("account_no")
);

-- CreateTable
CREATE TABLE "acwd_locations" (
    "location_no" VARCHAR(10) NOT NULL,
    "location_stat" VARCHAR(5) NOT NULL,
    "location_class" VARCHAR(10) NOT NULL,
    "house_no" VARCHAR(20),
    "street_pfx_dir" VARCHAR(10),
    "street_name" VARCHAR(60),
    "street_nm_sfx" VARCHAR(10),
    "street_sfx_dir" VARCHAR(10),
    "sec_addr_id" VARCHAR(10),
    "sec_addr_range" VARCHAR(20),
    "city" VARCHAR(30) NOT NULL,
    "province_cd" VARCHAR(5) NOT NULL,
    "postal_code" VARCHAR(13) NOT NULL,
    "imported_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acwd_locations_pkey" PRIMARY KEY ("location_no")
);

-- CreateTable
CREATE TABLE "acwd_moveinouts" (
    "id" VARCHAR(10) NOT NULL,
    "location_no" VARCHAR(10) NOT NULL,
    "account_no" VARCHAR(8) NOT NULL,
    "move_in_date" TIMESTAMP(3) NOT NULL,
    "move_out_date" TIMESTAMP(3),
    "status" VARCHAR(5) NOT NULL,
    "status_date" TIMESTAMP(3),
    "imported_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acwd_moveinouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acwd_import_runs" (
    "id" TEXT NOT NULL,
    "status" "AcwdImportStatus" NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "accounts_count" INTEGER NOT NULL DEFAULT 0,
    "locations_count" INTEGER NOT NULL DEFAULT 0,
    "moveinouts_count" INTEGER NOT NULL DEFAULT 0,
    "source_dir" VARCHAR(500),
    "error_message" TEXT,

    CONSTRAINT "acwd_import_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "acwd_accounts_person_no_idx" ON "acwd_accounts"("person_no");

-- CreateIndex
CREATE INDEX "acwd_locations_postal_code_idx" ON "acwd_locations"("postal_code");

-- CreateIndex
CREATE INDEX "acwd_moveinouts_account_no_status_idx" ON "acwd_moveinouts"("account_no", "status");

-- CreateIndex
CREATE INDEX "acwd_moveinouts_location_no_idx" ON "acwd_moveinouts"("location_no");
