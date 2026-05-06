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

  beforeEach(async () => {
    await clearDatabase();
    mock.restoreAll();
  });

  it("getSettings: должен возвращать дефолты, если в базе пусто", async () => {
    const res = await managerCaller.getSettings();
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
      additionalText: "",
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
      additionalText: "",
    });

    const updated = await db.studentReport.findUnique({
      where: { id: report.id },
    });
    assert.strictEqual(updated?.status, "SENT");
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
