import { z } from "zod";
import { TeacherSchema, TeacherWorkingHourSchema } from "@btw-app/db";

export const UpdateTeacherSchema = TeacherSchema.pick({
  id: true,
  name: true,
  email: true,
  phone: true,
  avatarUrl: true,
  note: true,
}).partial({
  name: true,
  email: true,
  phone: true,
  avatarUrl: true,
  note: true,
});
export type UpdateTeacherInput = z.infer<typeof UpdateTeacherSchema>;

export const UpdateTeacherSubjectsSchema = z.object({
  teacherId: z.number().int(),
  subjectIds: z.array(z.number().int()),
});

export const CreateWorkingHourSchema = TeacherWorkingHourSchema.pick({
  teacherId: true,
  dayIndex: true,
  timeFrom: true,
  timeTo: true,
});

export const UpdateWorkingHourSchema = TeacherWorkingHourSchema.pick({
  id: true,
  timeFrom: true,
  timeTo: true,
});
