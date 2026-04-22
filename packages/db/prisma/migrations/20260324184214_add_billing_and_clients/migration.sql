-- CreateTable
CREATE TABLE "clients" (
    "id" SERIAL NOT NULL,
    "alfa_id" INTEGER NOT NULL,
    "is_self_paid" BOOLEAN NOT NULL DEFAULT true,
    "student_tg_chat_id" TEXT,
    "parent_tg_chat_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_templates" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_logs" (
    "id" SERIAL NOT NULL,
    "alfa_id" INTEGER NOT NULL,
    "month" TEXT NOT NULL,
    "amount_calculated" DOUBLE PRECISION NOT NULL,
    "message_body" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,

    CONSTRAINT "billing_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clients_alfa_id_key" ON "clients"("alfa_id");
