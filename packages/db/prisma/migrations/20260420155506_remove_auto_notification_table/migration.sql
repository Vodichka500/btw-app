/*
  Warnings:

  - You are about to drop the `ReportNotificationRule` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ReportNotificationRule" DROP CONSTRAINT "ReportNotificationRule_settingsId_fkey";

-- AlterTable
ALTER TABLE "ReportSettings" ADD COLUMN     "defaultReminderText" TEXT NOT NULL DEFAULT '';

-- DropTable
DROP TABLE "ReportNotificationRule";

-- DropEnum
DROP TYPE "NotificationTiming";
