import { describe, it, beforeEach } from "node:test";
import * as assert from "node:assert";
import { categoryRouter } from "../src/routers/category";
import { db } from "@btw-app/db";
import { clearDatabase } from "./setup";

describe("Category Router (Деревья и Транзакции)", () => {
  const ctx = {
    db,
    user: { id: "m1", role: "MANAGER" as const },
    session: { id: "s1" },
    req: {},
    res: {},
  };
  const caller = categoryRouter.createCaller(ctx as any);

  beforeEach(async () => await clearDatabase());

  it("getAll: должен строить правильное дерево категорий", async () => {
    // 1. Создаем структуру: Родитель -> Ребенок
    const parent = await db.category.create({
      data: { name: "Родитель", order: 1 },
    });
    await db.category.create({
      data: { name: "Ребенок", parentId: parent.id, order: 1 },
    });

    // 2. Получаем дерево
    const tree = await caller.getAll();

    // 3. Проверяем вложенность
    assert.strictEqual(
      tree.length,
      1,
      "На верхнем уровне должен быть один корень",
    );
    assert.strictEqual(tree[0].name, "Родитель");
    assert.strictEqual(tree[0].children.length, 1);
    assert.strictEqual(tree[0].children[0].name, "Ребенок");
  });

  it("softDelete: должен помечать категорию и сниппеты как удаленные", async () => {
    const cat = await db.category.create({ data: { name: "Под снос" } });
    const snip = await db.snippet.create({
      data: { title: "Сниппет", categoryId: cat.id, body: "test" },
    });

    await caller.softDelete({ id: cat.id, withSnippets: true });

    // Проверяем категорию
    const updatedCat = await db.category.findUnique({ where: { id: cat.id } });
    assert.ok(updatedCat?.deletedAt, "Категория должна иметь дату удаления");

    // Проверяем сниппет
    const updatedSnip = await db.snippet.findUnique({ where: { id: snip.id } });
    assert.ok(
      updatedSnip?.deletedAt,
      "Сниппет должен быть удален вместе с категорией",
    );
  });

  it("updateStructure: должен массово обновлять порядок (Drag & Drop)", async () => {
    const c1 = await db.category.create({ data: { name: "1", order: 1 } });
    const c2 = await db.category.create({ data: { name: "2", order: 2 } });

    // Меняем их местами
    await caller.updateStructure([
      { id: c1.id, order: 2, parentId: null },
      { id: c2.id, order: 1, parentId: null },
    ]);

    const res2 = await db.category.findUnique({ where: { id: c2.id } });
    assert.strictEqual(res2?.order, 1);
  });
});
