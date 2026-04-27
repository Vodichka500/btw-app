-- AlterTable
ALTER TABLE "StudentReport" ADD COLUMN     "alfaSubjectId" INTEGER;

-- AddForeignKey
ALTER TABLE "StudentReport" ADD CONSTRAINT "StudentReport_alfaSubjectId_fkey" FOREIGN KEY ("alfaSubjectId") REFERENCES "alfaSubjects"("alfa_id") ON DELETE SET NULL ON UPDATE CASCADE;
