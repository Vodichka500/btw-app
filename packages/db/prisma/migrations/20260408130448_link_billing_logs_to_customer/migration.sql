-- AddForeignKey
ALTER TABLE "billing_logs" ADD CONSTRAINT "billing_logs_alfa_id_fkey" FOREIGN KEY ("alfa_id") REFERENCES "customers"("alfa_id") ON DELETE RESTRICT ON UPDATE CASCADE;
