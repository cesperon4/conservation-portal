-- CreateTable
CREATE TABLE "program_statuses" (
    "id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "admin_step_number" VARCHAR(20) NOT NULL,
    "customer_step_number" VARCHAR(20) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "customer_name" VARCHAR(255),
    "description" TEXT,
    "milestone" BOOLEAN NOT NULL DEFAULT false,
    "days_before_alert" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "program_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "program_statuses_program_id_deleted_at_idx" ON "program_statuses"("program_id", "deleted_at");

-- CreateIndex
CREATE INDEX "program_statuses_program_id_milestone_idx" ON "program_statuses"("program_id", "milestone");

-- CreateIndex
CREATE UNIQUE INDEX "program_statuses_program_id_sort_order_key" ON "program_statuses"("program_id", "sort_order");

-- AddForeignKey
ALTER TABLE "program_statuses" ADD CONSTRAINT "program_statuses_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
