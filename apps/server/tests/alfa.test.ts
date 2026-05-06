import { describe, it, beforeEach, mock } from "node:test";
import * as assert from "node:assert";
import { alfaRouter } from "../src/routers/alfa/alfa";
import { db } from "@btw-app/db";
import { clearDatabase } from "./setup";

describe("Alfa Router", () => {
  // Контекст пользователя с настроенным AlfaCRM
  const ctx = {
    db,
    user: {
      id: "u1",
      role: "MANAGER" as const,
      alfaEmail: "test@test.pl",
      alfaToken: "token123",
    },
    session: { id: "s1" },
    req: {},
    res: {},
  };
  const caller = alfaRouter.createCaller(ctx as any);

  beforeEach(async () => {
    await clearDatabase();
    mock.restoreAll();
  });

  // Вспомогательная функция для мока fetch
  const mockFetch = (data: any) => {
    return mock.method(globalThis, "fetch", async () => ({
      ok: true,
      json: async () => ({
        success: true,
        items: data,
        page: 1,
        total: data.length,
        token: "new-temp-token",
      }),
    }));
  };

  it("getTempToken: должен возвращать ошибку, если профиль не настроен", async () => {
    const emptyCtx = { ...ctx, user: { ...ctx.user, alfaEmail: null } };
    const emptyCaller = alfaRouter.createCaller(emptyCtx as any);

    await assert.rejects(
      async () => await emptyCaller.getTempToken(),
      (err: any) => err.code === "UNAUTHORIZED",
    );
  });

  it("updateTeachers: должен корректно синхронизировать новых и существующих учителей", async () => {
    // 1. Создаем одного учителя в базе заранее
    await db.teacher.create({
      data: {
        alfacrmId: 1,
        name: "Stary Nauczyciel",
        email: "old@test.pl",
        note: "Notatka",
      },
    });

    // 2. Мокаем ответ API: один старый (с измененным именем) и один новый
    mockFetch([
      {
        id: 1,
        name: "Zmieniony Nauczyciel",
        email: ["old@test.pl"],
        phone: "123",
      }, // Update
      { id: 2, name: "Nowy Nauczyciel", email: ["new@test.pl"], phone: "456" }, // New
    ]);

    const result = await caller.updateTeachers({ alfaTempToken: "fake" });

    // 3. Проверяем статистику возврата
    assert.strictEqual(result.added, 1);
    assert.strictEqual(result.updated, 1);
    assert.strictEqual(result.total, 2);

    // 4. Проверяем БД
    const teacher1 = await db.teacher.findFirst({ where: { alfacrmId: 1 } });
    assert.strictEqual(teacher1?.name, "Zmieniony Nauczyciel");
    assert.strictEqual(teacher1?.phone, "123");

    const teacher2 = await db.teacher.findFirst({ where: { alfacrmId: 2 } });
    assert.ok(teacher2);
    assert.strictEqual(teacher2?.name, "Nowy Nauczyciel");
  });

  it("getTeacherLessons: должен правильно разносить уроки по часовым ячейкам", async () => {
    // Мокаем fetch для уроков, предметов и клиентов
    mock.method(globalThis, "fetch", async (url: string) => {
      let items: any[] = [];
      if (url.includes("regular-lesson")) {
        items = [
          {
            day: 1, // Понедельник
            time_from_v: "14:00:00",
            time_to_v: "15:30:00",
            subject_id: 10,
            related_class: "Customer",
            related_id: 100,
          },
        ];
      } else if (url.includes("subject")) {
        items = [{ id: 10, name: "Matematyka" }];
      } else if (url.includes("customer")) {
        items = [{ id: 100, name: "Jan Kowalski" }];
      }

      return {
        ok: true,
        json: async () => ({
          success: true,
          items,
          page: 1,
          total: items.length,
        }),
      };
    });

    const schedule = await caller.getTeacherLessons({
      teacherAlfacrmId: 1,
      alfaTempToken: "fake",
    });

    // Урок идет с 14:00 до 15:30. Он должен попасть в ячейки 14:00 и 15:00.
    // Ключ формата "день-час" (день 0-индексирован: 1-1=0)
    assert.ok(schedule["0-14"], "Должна быть запись на 14:00");
    assert.ok(
      schedule["0-15"],
      "Должна быть запись на 15:00 (так как урок до 15:30)",
    );

    // Проверяем детали в 14:00
    const cell14 = schedule["0-14"][0];
    assert.strictEqual(cell14.subject, "Matematyka");
    assert.strictEqual(cell14.student, "Jan Kowalski");
    assert.strictEqual(cell14.startMin, 0);
    assert.strictEqual(cell14.endMin, 60); // В 14-часовом блоке он занимает весь час

    // Проверяем детали в 15:00
    const cell15 = schedule["0-15"][0];
    assert.strictEqual(cell15.startMin, 0);
    assert.strictEqual(cell15.endMin, 30); // А в 15-часовом — только первые 30 минут
  });

  it("getRemoteCustomers: должен возвращать упрощенный список активных клиентов", async () => {
    mockFetch([
      {
        id: 100,
        name: "Klient A",
        is_study: 1,
        teacher_ids: [1, 2],
        ignored_field: "hide me",
      },
      { id: 101, name: "Klient B", is_study: 1 },
    ]);

    const result = await caller.getRemoteCustomers({ alfaTempToken: "fake" });

    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].name, "Klient A");
    assert.ok(
      !("ignored_field" in result[0]),
      "Лишние поля из API должны отсекаться",
    );
    assert.deepStrictEqual(result[0].teacher_ids, [1, 2]);
  });
});
