-- CreateTable
CREATE TABLE "sync_states" (
    "type" TEXT NOT NULL,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_states_pkey" PRIMARY KEY ("type")
);
