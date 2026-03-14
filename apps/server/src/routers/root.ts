import { router } from "../trpc";
import { testRouter } from "./test";
import { categoryRouter } from "./category";
import { snippetRouter } from "./snippet";
import { trashRouter } from "./trash";
import { scheduleRouter } from "./schedule";
import { alfaRouter } from "./alfa";
import { teacherRouter } from "./teacher";
import { subjectRouter } from "./subject";

export const appRouter = router({
  test: testRouter, // Теперь все методы доступны через test.ping, test.hello и т.д.
  categories: categoryRouter,
  snippets: snippetRouter,
  trash: trashRouter,
  schedule: scheduleRouter,
  alfa: alfaRouter,
  teachers: teacherRouter,
  subjects: subjectRouter,
});

export type AppRouter = typeof appRouter;
