import { describe, it, beforeEach, mock } from "node:test";
import * as assert from "node:assert";
import { customerRouter } from "../src/routers/customer";
import { db } from "@btw-app/db";
import { clearDatabase } from "./setup";

describe("Customer Router (Синхронизация и Поиск)", () => {
  const ctx = {
    db,
    user: {
      id: "m1",
      role: "MANAGER" as const,
      alfaEmail: "alfa@emal.com",
      alfaToken: "token123",
    },
    session: { id: "s1" },
    req: {},
    res: {},
  };
  const caller = customerRouter.createCaller(ctx as any);

  beforeEach(async () => {
    await clearDatabase();
    mock.restoreAll();
  });

  it("synchronizeCustomers: должен выполнять полный цикл (New, Update, Archive)", async () => {
    // 1. Подготовка БД:
    await db.customer.create({
      data: { alfaId: 1, name: "Останется", teacherIds: [] },
    });
    await db.customer.create({
      data: { alfaId: 2, name: "Старое Имя", teacherIds: [] },
    });
    await db.customer.create({
      data: { alfaId: 3, name: "Пропадет", teacherIds: [] },
    });

    // 2. Универсальный мок fetch
    mock.method(globalThis, "fetch", async (url: string) => {
      let items: any[] = [];
      let token = undefined;

      if (url.includes("auth/login")) {
        token = "fake";
      } else if (url.includes("customer/index")) {
        items = [
          { id: 1, name: "Останется", teacher_ids: [] }, // Нет изменений
          { id: 2, name: "Новое Имя", teacher_ids: [] }, // Update
          { id: 4, name: "Новенький", teacher_ids: [] }, // New
        ];
      } else if (url.includes("lesson/index")) {
        // Добавляем мок для уроков, чтобы хелпер не упал, и чтобы протестировать группы
        items = [
          {
            group_ids: [100],
            details: [
              { customer_id: 1 }, // У Останется появится группа 100
              { customer_id: 4 }, // У Новенького тоже появится группа 100
            ],
          },
        ];
      }

      return {
        ok: true,
        status: 200, // Обязательно для makeAlfaCrmAuthRequest!
        json: async () => ({
          success: true,
          items,
          page: 1,
          total: items.length,
          count: items.length, // Обязательно для fetchAllAlfaPages!
          token,
        }),
      } as any;
    });

    const result = await caller.synchronizeCustomers();
    assert.ok(result.success);

    // 3. Проверки
    const c1 = await db.customer.findUnique({ where: { alfaId: 1 } });
    assert.deepStrictEqual(
      c1?.groupIds,
      [100],
      "Группа из уроков должна привязаться к существующему клиенту",
    );

    const c2 = await db.customer.findUnique({ where: { alfaId: 2 } });
    assert.strictEqual(c2?.name, "Новое Имя", "Имя должно обновиться");

    const c3 = await db.customer.findUnique({ where: { alfaId: 3 } });
    assert.strictEqual(
      c3?.isRemoved,
      true,
      "Клиент, пропавший из API, должен быть в архиве",
    );

    const c4 = await db.customer.findUnique({ where: { alfaId: 4 } });
    assert.ok(c4, "Новый клиент должен быть создан");
    assert.deepStrictEqual(
      c4?.groupIds,
      [100],
      "Группа из уроков должна привязаться к новому клиенту",
    );
  });

  it("getSavedCustomers: должен корректно фильтровать и пагинировать", async () => {
    // Создаем тестовый набор
    await db.customer.createMany({
      data: [
        {
          name: "Анна",
          alfaId: 10,
          teacherIds: [1],
          groupIds: [100, 200],
          customClass: "A1",
        },
        {
          name: "Борис",
          alfaId: 20,
          teacherIds: [],
          groupIds: [],
          customClass: null,
        },
        {
          name: "Виктор",
          alfaId: 30,
          teacherIds: [2],
          groupIds: [200],
          customClass: "B2",
        },
      ],
    });

    const searchRes = await caller.getSavedCustomers({
      page: 1,
      limit: 10,
      search: "Анн",
    });
    assert.strictEqual(searchRes.items.length, 1);
    assert.strictEqual(searchRes.items[0].name, "Анна");

    const noClassRes = await caller.getSavedCustomers({
      page: 1,
      limit: 10,
      noClass: true,
    });
    assert.strictEqual(noClassRes.items.length, 1);
    assert.strictEqual(noClassRes.items[0].name, "Борис");

    const groupRes = await caller.getSavedCustomers({
      page: 1,
      limit: 10,
      groupId: 200,
    });
    assert.strictEqual(groupRes.items.length, 2);
    const names = groupRes.items.map((i) => i.name).sort();
    assert.deepStrictEqual(names, ["Анна", "Виктор"]);

    const pageRes = await caller.getSavedCustomers({ page: 2, limit: 1 });
    assert.strictEqual(pageRes.currentPage, 2);
    assert.strictEqual(pageRes.totalPages, 3);
  });
});
