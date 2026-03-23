-- AlterTable
ALTER TABLE "user" ADD COLUMN     "teacher_id" INTEGER;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
