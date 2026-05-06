import { describe, it } from "node:test";
import * as assert from "node:assert";
import { aggregateLessons } from "../src/lib/report-helpers";
import type { AlfaLesson, AlfaLessonDetail } from "@btw-app/shared";

describe("Report Helpers: aggregateLessons", () => {
  // Вспомогательная функция для создания мока урока
  const createMockLesson = (overrides: Partial<AlfaLesson>): AlfaLesson =>
    ({
      id: 1,
      teacher_ids: [1],
      customer_ids: [100],
      subject_id: null,
      group_ids: [],
      details: [],
      ...overrides,
    }) as AlfaLesson;

  const mockGroupMap = new Map<number, string>([
    [10, "Grupa Angielski"],
    [20, "Grupa Matematyka"],
  ]);

  it("Должен правильно считать посещения для индивидуальных уроков (is_attend: 1)", () => {
    const lessons = [
      createMockLesson({
        teacher_ids: [1],
        customer_ids: [100],
        subject_id: 5,
        details: [
          { customer_id: 100, is_attend: 1 } as any as AlfaLessonDetail,
        ], // Был
      }),
      createMockLesson({
        teacher_ids: [1],
        customer_ids: [100],
        subject_id: 5,
        details: [
          { customer_id: 100, is_attend: 0 } as any as AlfaLessonDetail,
        ], // Не был
      }),
    ];

    const result = aggregateLessons(lessons, mockGroupMap, "ALL");

    // Проверяем, что для учителя 1 есть запись
    const teacherData = result.get(1);
    assert.ok(teacherData, "Учитель 1 должен быть в статистике");

    // Проверяем группу (индивидуальная + предмет 5)
    const groupKey = "INDIVIDUAL_SUB_5";
    const groupData = teacherData.get(groupKey);
    assert.ok(groupData, `Должен существовать ключ ${groupKey}`);

    // Проверяем статистику студента 100
    const studentStats = groupData.get(100);
    assert.ok(studentStats);
    assert.strictEqual(
      studentStats.attended,
      1,
      "Должен засчитать только 1 посещение",
    );
    assert.strictEqual(studentStats.groupName, "Indywidualne");
    assert.strictEqual(studentStats.alfaSubjectId, 5);
  });

  it("Должен правильно разделять предметы для одного студента", () => {
    const lessons = [
      createMockLesson({
        teacher_ids: [1],
        customer_ids: [100],
        subject_id: 1, // Предмет 1
        details: [
          { customer_id: 100, is_attend: 1 } as any as AlfaLessonDetail,
        ],
      }),
      createMockLesson({
        teacher_ids: [1],
        customer_ids: [100],
        subject_id: 2, // Предмет 2
        details: [
          { customer_id: 100, is_attend: 1 } as any as AlfaLessonDetail,
        ],
      }),
    ];

    const result = aggregateLessons(lessons, mockGroupMap, "ALL");
    const teacherData = result.get(1)!;

    // У одного и того же студента должно быть ДВЕ разные ветки статистики из-за разных предметов
    assert.ok(teacherData.has("INDIVIDUAL_SUB_1"));
    assert.ok(teacherData.has("INDIVIDUAL_SUB_2"));
  });

  it("Должен фильтровать уроки по типу: INDIVIDUAL", () => {
    const lessons = [
      createMockLesson({
        subject_id: 1,
        group_ids: [10], // Групповой урок
        details: [
          { customer_id: 100, is_attend: 1 } as any as AlfaLessonDetail,
        ],
      }),
      createMockLesson({
        subject_id: 2,
        group_ids: [], // Индивидуальный урок
        details: [
          { customer_id: 100, is_attend: 1 } as any as AlfaLessonDetail,
        ],
      }),
    ];

    // Запрашиваем ТОЛЬКО индивидуальные
    const result = aggregateLessons(lessons, mockGroupMap, "INDIVIDUAL");
    const teacherData = result.get(1)!;

    assert.ok(
      teacherData.has("INDIVIDUAL_SUB_2"),
      "Индивидуальный урок должен попасть в отчет",
    );
    assert.strictEqual(
      teacherData.has("GROUP_10_SUB_1"),
      false,
      "Групповой урок должен быть отфильтрован",
    );
  });

  it("Должен фильтровать уроки по типу: GROUP и правильно подтягивать имя группы", () => {
    const lessons = [
      createMockLesson({
        subject_id: 1,
        group_ids: [10], // Группа 10 есть в нашем mockGroupMap
        details: [
          { customer_id: 100, is_attend: 1 } as any as AlfaLessonDetail,
        ],
      }),
      createMockLesson({
        subject_id: 2,
        group_ids: [999], // Группы 999 нет в мапе
        details: [
          { customer_id: 100, is_attend: 1 } as any as AlfaLessonDetail,
        ],
      }),
    ];

    // Запрашиваем ТОЛЬКО групповые
    const result = aggregateLessons(lessons, mockGroupMap, "GROUP");
    const teacherData = result.get(1)!;

    // Проверяем известную группу
    const knownGroupStats = teacherData.get("GROUP_10_SUB_1")?.get(100);
    assert.strictEqual(knownGroupStats?.groupName, "Grupa Angielski");

    // Проверяем неизвестную группу (фоллбек на ID)
    const unknownGroupStats = teacherData.get("GROUP_999_SUB_2")?.get(100);
    assert.strictEqual(unknownGroupStats?.groupName, "Grupa #999");

    // Индивидуальных ключей быть не должно
    const keys = Array.from(teacherData.keys());
    assert.ok(
      keys.every((k) => k.startsWith("GROUP_")),
      "В результатах не должно быть индивидуальных уроков",
    );
  });

  it("Должен размножать статистику, если урок ведут несколько учителей для нескольких учеников", () => {
    const lessons = [
      createMockLesson({
        teacher_ids: [1, 2], // Два учителя
        customer_ids: [100, 200], // Два ученика
        subject_id: 5,
        details: [
          { customer_id: 100, is_attend: 1 } as any as AlfaLessonDetail,
          { customer_id: 200, is_attend: 0 } as any as AlfaLessonDetail, // Второй ученик отсутствовал
        ],
      }),
    ];

    const result = aggregateLessons(lessons, mockGroupMap, "ALL");

    // Проверяем Учителя 1
    const t1Group = result.get(1)?.get("INDIVIDUAL_SUB_5");
    assert.strictEqual(t1Group?.get(100)?.attended, 1);
    assert.strictEqual(t1Group?.get(200)?.attended, 0);

    // Проверяем Учителя 2 (данные должны быть идентичны)
    const t2Group = result.get(2)?.get("INDIVIDUAL_SUB_5");
    assert.strictEqual(t2Group?.get(100)?.attended, 1);
    assert.strictEqual(t2Group?.get(200)?.attended, 0);
  });
});
