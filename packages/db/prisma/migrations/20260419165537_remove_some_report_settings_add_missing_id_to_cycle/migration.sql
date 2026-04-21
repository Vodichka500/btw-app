/*
  Warnings:

  - You are about to drop the column `generationDays` on the `ReportSettings` table. All the data in the column will be lost.
  - You are about to drop the column `minLessons` on the `ReportSettings` table. All the data in the column will be lost.
  - You are about to drop the column `useLastDayOfMonth` on the `ReportSettings` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[alfacrmId]` on the table `teachers` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ReportCycle" ADD COLUMN     "missingCustomers" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "missingTeachers" INTEGER[] DEFAULT ARRAY[]::INTEGER[];

-- AlterTable
ALTER TABLE "ReportSettings" DROP COLUMN "generationDays",
DROP COLUMN "minLessons",
DROP COLUMN "useLastDayOfMonth";

-- CreateIndex
CREATE UNIQUE INDEX "teachers_alfacrmId_key" ON "teachers"("alfacrmId");

-- AddForeignKey
ALTER TABLE "StudentReport" ADD CONSTRAINT "StudentReport_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("alfacrmId") ON DELETE CASCADE ON UPDATE CASCADE;
