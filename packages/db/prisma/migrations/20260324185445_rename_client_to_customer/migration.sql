/*
  Warnings:

  - You are about to drop the `clients` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "clients";

-- CreateTable
CREATE TABLE "customers" (
    "id" SERIAL NOT NULL,
    "alfa_id" INTEGER NOT NULL,
    "is_self_paid" BOOLEAN NOT NULL DEFAULT true,
    "student_tg_chat_id" TEXT,
    "parent_tg_chat_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_alfa_id_key" ON "customers"("alfa_id");
