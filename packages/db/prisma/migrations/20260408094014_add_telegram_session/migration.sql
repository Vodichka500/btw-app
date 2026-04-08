-- CreateTable
CREATE TABLE "telegram_sessions" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "phoneNumber" TEXT,
    "sessionString" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "telegram_sessions_pkey" PRIMARY KEY ("id")
);
