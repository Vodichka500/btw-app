-- CreateEnum
CREATE TYPE "ReportCriterionType" AS ENUM ('SELECT', 'TEXT');

-- AlterTable
ALTER TABLE "ReportCriterion" ADD COLUMN     "required" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "type" "ReportCriterionType" NOT NULL DEFAULT 'SELECT';
