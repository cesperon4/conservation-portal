/*
  Warnings:

  - You are about to drop the `program_budget_logs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "program_budget_logs" DROP CONSTRAINT "program_budget_logs_program_id_fkey";

-- DropForeignKey
ALTER TABLE "program_budget_logs" DROP CONSTRAINT "program_budget_logs_user_id_fkey";

-- DropTable
DROP TABLE "program_budget_logs";

-- CreateTable
CREATE TABLE "program_budget_log" (
    "id" TEXT NOT NULL,
    "previous_budget" DECIMAL(12,2),
    "new_budget" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "program_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "comment" TEXT,

    CONSTRAINT "program_budget_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "program_budget_log_program_id_idx" ON "program_budget_log"("program_id");

-- CreateIndex
CREATE INDEX "program_budget_log_user_id_idx" ON "program_budget_log"("user_id");

-- AddForeignKey
ALTER TABLE "program_budget_log" ADD CONSTRAINT "program_budget_log_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_budget_log" ADD CONSTRAINT "program_budget_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
