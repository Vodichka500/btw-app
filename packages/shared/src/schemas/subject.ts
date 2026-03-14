import { z } from "zod";
import { SubjectSchema, type Subject, type Teacher } from "@btw-app/db";

export const CreateSubjectSchema = SubjectSchema.pick({ name: true });
export type CreateSubjectInput = z.infer<typeof CreateSubjectSchema>;

export const UpdateSubjectSchema = SubjectSchema.pick({ id: true, name: true });
export type UpdateSubjectInput = z.infer<typeof UpdateSubjectSchema>;

export type SubjectWithTeachers = Subject & {
  teachers: Teacher[];
};
