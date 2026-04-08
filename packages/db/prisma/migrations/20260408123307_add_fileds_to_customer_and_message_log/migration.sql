-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('SUCCESS', 'FAILED');

-- AlterTable (БЕЗОПАСНЫЙ ПЕРЕХОД)
ALTER TABLE "billing_logs"
ALTER COLUMN "status" TYPE "MessageStatus" 
USING ("status"::text::"MessageStatus");

-- AlterTable (Остальное оставляем как есть)
ALTER TABLE "customers" ADD COLUMN     "is_removed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_study" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "teacher_ids" INTEGER[];

-- CreateTable
CREATE TABLE "message_logs" (
                                "id" SERIAL NOT NULL,
                                "alfa_id" INTEGER NOT NULL,
                                "message_body" TEXT NOT NULL,
                                "status" "MessageStatus" NOT NULL,
                                "error_reason" TEXT,
                                "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                CONSTRAINT "message_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "message_logs_alfa_id_idx" ON "message_logs"("alfa_id");

-- AddForeignKey
ALTER TABLE "message_logs" ADD CONSTRAINT "message_logs_alfa_id_fkey" FOREIGN KEY ("alfa_id") REFERENCES "customers"("alfa_id") ON DELETE RESTRICT ON UPDATE CASCADE;