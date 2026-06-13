-- CreateTable: role profile tables
CREATE TABLE "admin_profiles" (
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "admin_profiles_pkey" PRIMARY KEY ("user_id")
);

CREATE TABLE "customer_profiles" (
    "user_id" TEXT NOT NULL,
    "mailing_address" VARCHAR(255) NOT NULL,
    "mailing_city" VARCHAR(50) NOT NULL,
    "mailing_state" VARCHAR(50) NOT NULL,
    "mailing_zip" VARCHAR(50) NOT NULL,
    "company" VARCHAR(255),
    "title" VARCHAR(50),
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "customer_profiles_pkey" PRIMARY KEY ("user_id")
);

-- Backfill admin_profiles: admins + anyone referenced as program/budget-log owner
INSERT INTO "admin_profiles" ("user_id", "created_at", "updated_at")
SELECT DISTINCT u."id", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "users" u
WHERE u."role" = 'admin'::"Role"
   OR u."id" IN (SELECT "user_id" FROM "programs")
   OR u."id" IN (SELECT "user_id" FROM "program_budget_logs");

-- Backfill customer_profiles for existing customers (placeholder mailing until profile completion)
INSERT INTO "customer_profiles" (
    "user_id",
    "mailing_address",
    "mailing_city",
    "mailing_state",
    "mailing_zip",
    "created_at",
    "updated_at"
)
SELECT
    u."id",
    'Unknown',
    'Unknown',
    'CA',
    '00000',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "users" u
WHERE u."role" = 'customer'::"Role";

-- Profile FKs to users
ALTER TABLE "admin_profiles"
ADD CONSTRAINT "admin_profiles_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "customer_profiles"
ADD CONSTRAINT "customer_profiles_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "admin_profiles_created_at_idx" ON "admin_profiles"("created_at");
CREATE INDEX "admin_profiles_deleted_at_idx" ON "admin_profiles"("deleted_at");
CREATE INDEX "customer_profiles_created_at_idx" ON "customer_profiles"("created_at");
CREATE INDEX "customer_profiles_deleted_at_idx" ON "customer_profiles"("deleted_at");

-- programs: user_id -> admin_user_id (via admin_profiles)
ALTER TABLE "programs" ADD COLUMN "admin_user_id" TEXT;

UPDATE "programs" SET "admin_user_id" = "user_id";

ALTER TABLE "programs" DROP CONSTRAINT "programs_user_id_fkey";
DROP INDEX "programs_user_id_idx";
ALTER TABLE "programs" DROP COLUMN "user_id";

ALTER TABLE "programs" ALTER COLUMN "admin_user_id" SET NOT NULL;

CREATE INDEX "programs_admin_user_id_idx" ON "programs"("admin_user_id");

ALTER TABLE "programs"
ADD CONSTRAINT "programs_admin_user_id_fkey"
FOREIGN KEY ("admin_user_id") REFERENCES "admin_profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- program_budget_logs: user_id -> admin_user_id (via admin_profiles)
ALTER TABLE "program_budget_logs" ADD COLUMN "admin_user_id" TEXT;

UPDATE "program_budget_logs" SET "admin_user_id" = "user_id";

ALTER TABLE "program_budget_logs" DROP CONSTRAINT "program_budget_logs_user_id_fkey";
DROP INDEX "program_budget_logs_user_id_idx";
ALTER TABLE "program_budget_logs" DROP COLUMN "user_id";

ALTER TABLE "program_budget_logs" ALTER COLUMN "admin_user_id" SET NOT NULL;

CREATE INDEX "program_budget_logs_admin_user_id_idx" ON "program_budget_logs"("admin_user_id");

ALTER TABLE "program_budget_logs"
ADD CONSTRAINT "program_budget_logs_admin_user_id_fkey"
FOREIGN KEY ("admin_user_id") REFERENCES "admin_profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Other schema adjustments
ALTER TABLE "programs" ALTER COLUMN "grant_funding" SET DATA TYPE DECIMAL(65,30);

ALTER TABLE "program_budget_logs" ALTER COLUMN "comment" SET DATA TYPE VARCHAR(2000);
