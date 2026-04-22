-- CreateTable
CREATE TABLE "alfaSubjects" (
    "id" SERIAL NOT NULL,
    "alfa_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "alfaSubjects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "alfaSubjects_alfa_id_key" ON "alfaSubjects"("alfa_id");
