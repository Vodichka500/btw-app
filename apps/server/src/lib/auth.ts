import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "@btw-app/db";

type BaseSession = typeof auth.$Infer.Session;

export type CustomUser = BaseSession["user"] & {
  role: string;
  alfaEmail?: string | null;
  alfaToken?: string | null;
  tgChatId?: string | null;
};

export type FullSessionData = {
  session: BaseSession["session"];
  user: CustomUser;
};
export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: ["http://localhost:5173"],
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "TEACHER",
      },
      alfaEmail: {
        type: "string",
        required: false,
      },
      alfaToken: {
        type: "string",
        required: false,
      },
      tgChatId: {
        type: "string",
        required: false,
      },
    },
  },
});
