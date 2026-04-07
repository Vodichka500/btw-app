/*
  Warnings:

  - Added the required column `year` to the `billing_logs` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `month` on the `billing_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "billing_logs" ADD COLUMN     "year" INTEGER NOT NULL,
DROP COLUMN "month",
ADD COLUMN     "month" INTEGER NOT NULL;
