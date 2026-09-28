import { describe, it, beforeEach, mock } from "node:test";
import * as assert from "node:assert";
import { reportRouter } from "../src/routers/reports";
import { telegramRouter } from "../src/routers/telegram";
import { db } from "@btw-app/db";
import { clearDatabase } from "./setup";

describe("Report Router", () => {
  const managerCtx = {
    db,
    user: {
      id: "u-mgr",
      role: "MANAGER" as const,
      teacherId: 10,
      alfaEmail: "admin@test.pl",
      alfaToken: "secret-123",
    },
    session: { id: "s1" },
    req: {},
    res: {},
  };
  const managerCaller = reportRouter.createCaller(managerCtx as any);
  const createTeacherCaller = (teacherId: number) =>
    reportRouter.createCaller({
      ...managerCtx,
      user: {
        ...managerCtx.user,
        role: "TEACHER" as const,
        teacherId,
      },
    } as any);

  beforeEach(async () => {
    await clearDatabase();
    mock.restoreAll();
  });

  it("getSettings: должен возвращать дефолты, если в базе пусто", async () => {
    const res = await managerCaller.getSettings();
    assert.strictEqual(res.deadlineDays, 7);
  });

  it("getSettings: должен быть доступен учителю", async () => {
    const teacherCaller = createTeacherCaller(10);
    const res = await teacherCaller.getSettings();
    assert.strictEqual(res.deadlineDays, 7);
  });

  it("upsertCriterion: должен создать шаблон и критерий (с валидными данными)", async () => {
    const res = await managerCaller.upsertCriterion({
      name: "Грамматика",
      order: 1,
      tag: "{TEACHER_NAME}",
      options: ["Dobrze"],
    });

    assert.ok(res.id);
    const template = await db.reportTemplate.findUnique({ where: { id: 1 } });
    assert.ok(template);
  });

  it("sendReport: должен переводить в FAILED, если у родителя нет Telegram", async () => {
    const cycle = await db.reportCycle.create({
      data: { periodStart: new Date(), periodEnd: new Date() },
    });
    const teacher = await db.teacher.create({
      data: { alfacrmId: 77, name: "Teacher" },
    });
    const subject = await db.alfaSubject.create({
      data: { alfaId: 10, name: "Math" },
    });
    const student = await db.customer.create({
      data: {
        alfaId: 500,
        name: "Student",
        parentTgChatId: null,
        isSelfPaid: false,
      },
    });

    const report = await db.studentReport.create({
      data: {
        studentId: student.alfaId,
        teacherId: teacher.alfacrmId,
        cycleId: cycle.id,
        alfaSubjectId: subject.alfaId,
        status: "PENDING",
        lessonsAttended: 1,
      },
    });

    await managerCaller.sendReport({
      reportId: report.id,
      generatedText: "Текст",
    });

    const updated = await db.studentReport.findUnique({
      where: { id: report.id },
    });
    assert.strictEqual(updated?.status, "FAILED");
    assert.ok(updated?.sendError?.includes("Brak przypisanego konta"));
  });

  it("sendReport: должен успешно отправлять и ставить статус SENT", async () => {
    const cycle = await db.reportCycle.create({
      data: { periodStart: new Date(), periodEnd: new Date() },
    });
    const teacher = await db.teacher.create({
      data: { alfacrmId: 77, name: "Teacher" },
    });
    const subject = await db.alfaSubject.create({
      data: { alfaId: 10, name: "Math" },
    });

    const student = await db.customer.create({
      data: {
        alfaId: 500,
        name: "Student",
        parentTgChatId: "tg-123",
        isSelfPaid: false,
      },
    });

    const report = await db.studentReport.create({
      data: {
        studentId: student.alfaId,
        teacherId: teacher.alfacrmId,
        cycleId: cycle.id,
        alfaSubjectId: subject.alfaId,
        status: "PENDING",
        lessonsAttended: 1,
      },
    });

    mock.method(telegramRouter, "createCaller", () => ({
      sendMessage: async () => ({ success: true }),
    }));

    await managerCaller.sendReport({
      reportId: report.id,
      generatedText: "Успех",
    });

    const updated = await db.studentReport.findUnique({
      where: { id: report.id },
    });
    assert.strictEqual(updated?.status, "SENT");
  });

  it("sendReport: учитель может отправить свой отчёт", async () => {
    const cycle = await db.reportCycle.create({
      data: { periodStart: new Date(), periodEnd: new Date() },
    });
    const teacher = await db.teacher.create({
      data: { alfacrmId: 78, name: "Teacher 2" },
    });
    const subject = await db.alfaSubject.create({
      data: { alfaId: 11, name: "English" },
    });
    const student = await db.customer.create({
      data: {
        alfaId: 501,
        name: "Student 2",
        parentTgChatId: "tg-teacher-123",
        isSelfPaid: false,
      },
    });
    const report = await db.studentReport.create({
      data: {
        studentId: student.alfaId,
        teacherId: teacher.alfacrmId,
        cycleId: cycle.id,
        alfaSubjectId: subject.alfaId,
        status: "PENDING",
        lessonsAttended: 1,
      },
    });

    mock.method(telegramRouter, "createCaller", () => ({
      sendMessage: async () => ({ success: true }),
    }));

    await createTeacherCaller(teacher.id).sendReport({
      reportId: report.id,
      generatedText: "Teacher report",
    });

    const updated = await db.studentReport.findUnique({
      where: { id: report.id },
    });
    assert.strictEqual(updated?.status, "SENT");
  });

  it("sendReport: учитель не может отправить отчёт другого учителя", async () => {
    const cycle = await db.reportCycle.create({
      data: { periodStart: new Date(), periodEnd: new Date() },
    });
    const owner = await db.teacher.create({
      data: { alfacrmId: 79, name: "Owner" },
    });
    const anotherTeacher = await db.teacher.create({
      data: { alfacrmId: 80, name: "Another teacher" },
    });
    const subject = await db.alfaSubject.create({
      data: { alfaId: 12, name: "Physics" },
    });
    const student = await db.customer.create({
      data: {
        alfaId: 502,
        name: "Student 3",
        parentTgChatId: "tg-owner-123",
        isSelfPaid: false,
      },
    });
    const report = await db.studentReport.create({
      data: {
        studentId: student.alfaId,
        teacherId: owner.alfacrmId,
        cycleId: cycle.id,
        alfaSubjectId: subject.alfaId,
        status: "PENDING",
        lessonsAttended: 1,
      },
    });

    await assert.rejects(
      () =>
        createTeacherCaller(anotherTeacher.id).sendReport({
          reportId: report.id,
          generatedText: "Unauthorized report",
        }),
      (error: any) => error.code === "FORBIDDEN",
    );
  });

  it("getAdminCycles: должен правильно считать статистику", async () => {
    const cycle = await db.reportCycle.create({
      data: { periodStart: new Date(), periodEnd: new Date() },
    });

    await db.teacher.create({ data: { alfacrmId: 77, name: "T1" } });
    await db.alfaSubject.create({ data: { alfaId: 10, name: "S1" } });
    const s1 = await db.customer.create({
      data: { alfaId: 500, name: "S1", isSelfPaid: true },
    });
    const s2 = await db.customer.create({
      data: { alfaId: 501, name: "S2", isSelfPaid: true },
    });

    await db.studentReport.createMany({
      data: [
        {
          cycleId: cycle.id,
          status: "SENT",
          teacherId: 77,
          studentId: s1.alfaId,
          alfaSubjectId: 10,
          lessonsAttended: 1,
        },
        {
          cycleId: cycle.id,
          status: "PENDING",
          teacherId: 77,
          studentId: s2.alfaId,
          alfaSubjectId: 10,
          lessonsAttended: 1,
        },
      ],
    });

    const cycles = await managerCaller.getAdminCycles();
    const target = cycles.find((c) => c.id === cycle.id);

    assert.strictEqual(target?.stats.total, 2);
    assert.strictEqual(target?.stats.sent, 1);
  });
});
