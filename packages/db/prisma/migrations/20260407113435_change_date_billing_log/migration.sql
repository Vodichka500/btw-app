/*
  Warnings:

  - Added the required column `year` to the `billing_logs` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `month` on the `billing_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "billing_logs"
    RENAME COLUMN "month" TO "month_old";
ALTER TABLE "billing_logs"
    ADD COLUMN "year" INTEGER,
ADD COLUMN "month" INTEGER;
UPDATE "billing_logs"
SET
    "year" = COALESCE("year", EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER),
    "month" = COALESCE("month", "month_old"::text::INTEGER);
ALTER TABLE "billing_logs"
    ALTER COLUMN "year" SET NOT NULL,
ALTER COLUMN "month" SET NOT NULL;
ALTER TABLE "billing_logs"
DROP COLUMN "month_old";
