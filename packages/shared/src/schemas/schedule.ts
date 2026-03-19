import type { Teacher } from "@btw-app/db/zod";
import type { SubjectWithTeachers } from "./subject";

export type ScheduleDataResponse = {
  subjects: SubjectWithTeachers[];
  unassignedTeachers: Teacher[];
};
