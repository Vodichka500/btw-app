import { router } from "../trpc";
import { testRouter } from "./test";
import { categoryRouter } from "./category";
import { snippetRouter } from "./snippet";
import { trashRouter } from "./trash";
import { scheduleRouter } from "./schedule";
import { alfaRouter } from "./alfa/alfa";
import { teacherRouter } from "./teacher";
import { subjectRouter } from "./subject";
import { userRouter } from "./user";
import { metaRouter } from "./meta";
import { customerRouter } from "./customer";
import { alfaBilling } from "./alfa/alfa-billing";
import { billingTemplateRouter } from "./billing-template";
import { billingRouter } from "./billing";
import { billingLogRouter } from "./billing-log";
import { telegramRouter } from "./telegram";
import { alfaSubjectRouter } from "./alfa-subject";

export const appRouter = router({
  test: testRouter, // Теперь все методы доступны через test.ping, test.hello и т.д.
  categories: categoryRouter,
  snippets: snippetRouter,
  trash: trashRouter,
  schedule: scheduleRouter,
  alfa: alfaRouter,
  teachers: teacherRouter,
  subjects: subjectRouter,
  user: userRouter,
  meta: metaRouter,
  customer: customerRouter,
  alfaBilling: alfaBilling,
  billingTemplate: billingTemplateRouter,
  billing: billingRouter,
  billingLog: billingLogRouter,
  telegram: telegramRouter,
  alfaSubject: alfaSubjectRouter,
});

export type AppRouter = typeof appRouter;
