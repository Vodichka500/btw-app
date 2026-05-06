-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "group_ids" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
