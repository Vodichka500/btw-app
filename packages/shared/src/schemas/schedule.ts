import type { Teacher } from "@btw-app/db";
import type { SubjectWithTeachers } from "./subject";

export type ScheduleDataResponse = {
  subjects: SubjectWithTeachers[];
  unassignedTeachers: Teacher[];
};
