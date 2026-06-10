-- AlterTable: add password_hash (bcrypt hash of development seed password "Password123!")
ALTER TABLE "users" ADD COLUMN "password_hash" VARCHAR(255);

UPDATE "users"
SET "password_hash" = '$2b$12$RjMI3iwa.TCrDEbd1g0Anuv19Atsb2G5LhBO0ayVBxZROUAdVHyPq'
WHERE "password_hash" IS NULL;

ALTER TABLE "users" ALTER COLUMN "password_hash" SET NOT NULL;
