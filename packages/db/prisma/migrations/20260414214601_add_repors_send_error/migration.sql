-- AlterEnum
ALTER TYPE "ReportStatus" ADD VALUE 'FAILED';

-- AlterTable
ALTER TABLE "StudentReport" ADD COLUMN     "sendError" TEXT;
