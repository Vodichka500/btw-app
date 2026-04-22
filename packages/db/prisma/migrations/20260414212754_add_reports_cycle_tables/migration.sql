-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'SENT', 'CANCELED');

-- CreateTable
CREATE TABLE "ReportCycle" (
    "id" SERIAL NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentReport" (
    "id" SERIAL NOT NULL,
    "cycleId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "lessonsAttended" INTEGER NOT NULL,
    "groupName" TEXT,
    "teacherId" INTEGER NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "criteriaData" JSONB,
    "additionalText" TEXT,
    "generatedText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentReport_cycleId_idx" ON "StudentReport"("cycleId");

-- CreateIndex
CREATE INDEX "StudentReport_teacherId_idx" ON "StudentReport"("teacherId");

-- CreateIndex
CREATE INDEX "StudentReport_status_idx" ON "StudentReport"("status");

-- AddForeignKey
ALTER TABLE "StudentReport" ADD CONSTRAINT "StudentReport_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "ReportCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentReport" ADD CONSTRAINT "StudentReport_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "customers"("alfa_id") ON DELETE CASCADE ON UPDATE CASCADE;
