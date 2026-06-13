/*
  Warnings:

  - You are about to drop the `ProgramBudgetLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProgramBudgetLog" DROP CONSTRAINT "ProgramBudgetLog_program_id_fkey";

-- DropForeignKey
ALTER TABLE "ProgramBudgetLog" DROP CONSTRAINT "ProgramBudgetLog_user_id_fkey";

-- DropTable
DROP TABLE "ProgramBudgetLog";

-- CreateTable
CREATE TABLE "program_budget_logs" (
    "id" TEXT NOT NULL,
    "previous_budget" DECIMAL(12,2),
    "new_budget" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "program_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "comment" TEXT,

    CONSTRAINT "program_budget_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "program_budget_logs_program_id_idx" ON "program_budget_logs"("program_id");

-- CreateIndex
CREATE INDEX "program_budget_logs_user_id_idx" ON "program_budget_logs"("user_id");

-- AddForeignKey
ALTER TABLE "program_budget_logs" ADD CONSTRAINT "program_budget_logs_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_budget_logs" ADD CONSTRAINT "program_budget_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
