-- CreateTable
CREATE TABLE "programs" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "default_unit_water_savings" INTEGER NOT NULL,
    "default_unit_cost" DECIMAL(12,2) NOT NULL,
    "budget" DECIMAL(12,2) NOT NULL,
    "default_unit" TEXT NOT NULL,
    "single_family_home" BOOLEAN NOT NULL DEFAULT false,
    "multi_family_complex" BOOLEAN NOT NULL DEFAULT false,
    "residential" BOOLEAN NOT NULL DEFAULT false,
    "commercial" BOOLEAN NOT NULL DEFAULT false,
    "program_start" TIMESTAMP(3) NOT NULL,
    "program_end" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,
    "grant_funding" DOUBLE PRECISION NOT NULL,
    "third_party" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "programs_created_at_idx" ON "programs"("created_at");

-- CreateIndex
CREATE INDEX "programs_user_id_idx" ON "programs"("user_id");

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
