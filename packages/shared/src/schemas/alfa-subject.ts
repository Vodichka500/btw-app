import { z } from "zod";
import { AlfaSubjectSchema } from "@btw-app/db/zod";

export const UpdateAlfaSubjectSchema = z.object({
  alfaId: z.number().int(),
  name: z.string().min(1, "Nazwa przedmiotu nie może być pusta"),
});
export type UpdateAlfaSubjectInput = z.infer<typeof UpdateAlfaSubjectSchema>;

export type DbAlfaSubject = z.infer<typeof AlfaSubjectSchema>;
