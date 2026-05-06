import { describe, it, beforeEach, mock } from "node:test";
import * as assert from "node:assert";
import { alfaBilling } from "../src/routers/alfa/alfa-billing";

describe("Alfa Billing Router (Математика и Калькуляция)", () => {
  const ctx = {
    user: { id: "manager", role: "MANAGER" as const },
    session: { id: "session-123" },
    req: {},
    res: {},
  };
  const caller = alfaBilling.createCaller(ctx as any);

  beforeEach(() => {
    mock.restoreAll();
  });

  // Вспомогательная функция для имитации успешного ответа fetch
  const mockFetchResponse = (data: any) => ({
    ok: true,
    json: async () => ({
      success: true,
      items: data,
      page: 1,
      total: data.length,
    }),
  });

  it("Должен правильно считать долг, остаток и итоговую сумму к оплате", async () => {
    mock.method(globalThis, "fetch", async (url: string) => {
      if (url.includes("customer/index")) {
        return mockFetchResponse([
          { id: 1, name: "Василий", balance: "1000.00" },
        ]);
      }
      if (url.includes("lesson/index")) {
        return mockFetchResponse([
          {
            date: "2026-04-15",
            subject_id: 10,
            details: [{ customer_id: 1, commission: "2000.00" }],
          },
          {
            date: "2026-05-10",
            subject_id: 10,
            details: [{ customer_id: 1, commission: "5000.00" }],
          },
        ]);
      }
      return mockFetchResponse([]);
    });

    const result = await caller.getBillingReport({
      alfaTempToken: "fake",
      month: 4,
      year: 2026,
      forceRefresh: true,
    });
    const student = result.items[0];

    assert.strictEqual(student.currentBalance, 1000);
    assert.strictEqual(student.remainderAtStart, -1000); // 1000 - 2000
    assert.strictEqual(student.totalToPay, 6000); // 5000 - (-1000)
  });

  it("Должен корректно группировать уроки по предметам (subjects)", async () => {
    mock.method(globalThis, "fetch", async (url: string) => {
      if (url.includes("customer/index")) {
        return mockFetchResponse([{ id: 1, name: "Иван", balance: "0.00" }]);
      }
      if (url.includes("lesson/index")) {
        return mockFetchResponse([
          {
            date: "2026-05-01",
            subject_id: 10,
            details: [{ customer_id: 1, commission: "1000" }],
          }, // Мат
          {
            date: "2026-05-02",
            subject_id: 10,
            details: [{ customer_id: 1, commission: "1000" }],
          }, // Мат
          {
            date: "2026-05-03",
            subject_id: 20,
            details: [{ customer_id: 1, commission: "2000" }],
          }, // Физ
        ]);
      }
      return mockFetchResponse([]);
    });

    const result = await caller.getBillingReport({
      alfaTempToken: "fake",
      month: 4,
      year: 2026,
      forceRefresh: true,
    });
    const subjects = result.items[0].subjects;

    // Проверяем, что в массиве 2 уникальных предмета
    assert.strictEqual(subjects.length, 2);

    const math = subjects.find((s) => s.id === 10);
    const physics = subjects.find((s) => s.id === 20);

    assert.strictEqual(
      math?.quantity,
      2,
      "Математика должна быть посчитана дважды",
    );
    assert.strictEqual(
      physics?.quantity,
      1,
      "Физика должна быть посчитана один раз",
    );
  });

  it("Должен фильтровать учеников, у которых нет начислений и долгов в текущем месяце", async () => {
    mock.method(globalThis, "fetch", async (url: string) => {
      if (url.includes("customer/index")) {
        return mockFetchResponse([
          { id: 1, name: "Активный", balance: "0" },
          { id: 2, name: "Нулевой", balance: "5000" }, // У него большой плюс
        ]);
      }
      if (url.includes("lesson/index")) {
        return mockFetchResponse([
          {
            date: "2026-05-01",
            subject_id: 10,
            details: [{ customer_id: 1, commission: "1000" }],
          },
          // Ученик 2 не имеет уроков в этом месяце
        ]);
      }
      return mockFetchResponse([]);
    });

    const result = await caller.getBillingReport({
      alfaTempToken: "fake",
      month: 4,
      year: 2026,
      forceRefresh: true,
    });

    // Ученик 2 должен быть отфильтрован, так как у него totalToPay=0 и targetMonthCost=0
    assert.strictEqual(result.items.length, 1);
    assert.strictEqual(result.items[0].alfaId, 1);
  });

  it("Должен использовать кэш при повторном запросе", async () => {
    let fetchCounter = 0;
    mock.method(globalThis, "fetch", async () => {
      fetchCounter++;
      return mockFetchResponse([]);
    });

    // Первый запрос (данные попадут в кэш)
    await caller.getBillingReport({
      alfaTempToken: "fake",
      month: 1,
      year: 2026,
      forceRefresh: true,
    });
    const firstCount = fetchCounter;

    // Второй запрос (должен вернуться из кэша, fetch не должен вызываться)
    await caller.getBillingReport({
      alfaTempToken: "fake",
      month: 1,
      year: 2026,
      forceRefresh: false,
    });

    assert.strictEqual(
      fetchCounter,
      firstCount,
      "Fetch не должен вызываться при живом кэше",
    );
  });

  it("Должен правильно считать выручку в getRevenueStats", async () => {
    mock.method(globalThis, "fetch", async () => {
      return mockFetchResponse([
        {
          details: [
            { customer_id: 1, commission: "1500.50" },
            { customer_id: 2, commission: "1000.00" },
          ],
        },
        {
          details: [{ customer_id: 3, commission: "500.00" }],
        },
      ]);
    });

    const result = await caller.getRevenueStats({
      alfaTempToken: "fake",
      month: 4,
      year: 2026,
    });

    // 1500.50 + 1000 + 500 = 3000.50
    assert.strictEqual(result.totalRevenue, 3000.5);
    assert.strictEqual(result.lessonCount, 2);
  });
});
