/*
  Warnings:

  - The `variables` column on the `snippets` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[alfa_email]` on the table `user` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tg_chat_id]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'TEACHER');

-- AlterTable
ALTER TABLE "snippets" DROP COLUMN "variables",
ADD COLUMN     "variables" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "alfa_email" TEXT,
ADD COLUMN     "alfa_token" TEXT,
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'TEACHER',
ADD COLUMN     "tg_chat_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "user_alfa_email_key" ON "user"("alfa_email");

-- CreateIndex
CREATE UNIQUE INDEX "user_tg_chat_id_key" ON "user"("tg_chat_id");
