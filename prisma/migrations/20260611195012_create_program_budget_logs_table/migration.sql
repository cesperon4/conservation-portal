/*
  Warnings:

  - You are about to alter the column `default_unit_water_savings` on the `programs` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,2)`.

*/
-- AlterTable
ALTER TABLE "programs" ALTER COLUMN "default_unit_water_savings" SET DATA TYPE DECIMAL(10,2);

-- CreateTable
CREATE TABLE "ProgramBudgetLog" (
    "id" TEXT NOT NULL,
    "previous_budget" DECIMAL(12,2) NOT NULL,
    "new_budget" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "program_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "comment" TEXT NOT NULL,

    CONSTRAINT "ProgramBudgetLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProgramBudgetLog" ADD CONSTRAINT "ProgramBudgetLog_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramBudgetLog" ADD CONSTRAINT "ProgramBudgetLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
