import { describe, it, beforeEach } from "node:test";
import * as assert from "node:assert";
import { db } from "@btw-app/db";
import { userRouter } from "../src/routers/user";
import { clearDatabase } from "./setup";

const managerCtx = {
  db,
  user: {
    id: "manager-1",
    role: "MANAGER" as const,
    teacherId: null,
  },
  session: { id: "session-1" },
  req: {},
  res: {},
};

const getTodayInMinsk = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Minsk",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  return {
    month: Number(parts.find((part) => part.type === "month")?.value),
    day: Number(parts.find((part) => part.type === "day")?.value),
  };
};

describe("User birthdays", () => {
  const managerCaller = userRouter.createCaller(managerCtx as any);

  beforeEach(async () => {
    await clearDatabase();
  });

  it("returns users whose birthday is today regardless of birth year", async () => {
    const today = getTodayInMinsk();
    const now = new Date();
    const otherBirthday = new Date(Date.UTC(1990, today.month - 1, today.day));
    otherBirthday.setUTCDate(otherBirthday.getUTCDate() + 1);

    await db.user.createMany({
      data: [
        {
          id: "birthday-user",
          email: "birthday@example.com",
          name: "Birthday User",
          emailVerified: false,
          createdAt: now,
          updatedAt: now,
          role: "TEACHER",
          birthDate: new Date(Date.UTC(1990, today.month - 1, today.day)),
        },
        {
          id: "other-user",
          email: "other@example.com",
          name: "Other User",
          emailVerified: false,
          createdAt: now,
          updatedAt: now,
          role: "TEACHER",
          birthDate: otherBirthday,
        },
      ],
    });

    const birthdays = await managerCaller.getBirthdaysToday();

    assert.deepStrictEqual(birthdays, [
      { id: "birthday-user", name: "Birthday User" },
    ]);
  });
});
