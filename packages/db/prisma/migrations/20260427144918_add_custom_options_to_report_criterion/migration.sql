/*
  Warnings:

  - You are about to drop the column `type` on the `ReportCriterion` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ReportCriterion" DROP COLUMN "type",
ADD COLUMN     "options" TEXT[];

-- DropEnum
DROP TYPE "CriterionType";
