import { z } from "zod";

// 1. Инпуты (для валидации запросов от клиента)
export const AlfaCrmAuthInputSchema = z.object({
  email: z.string().email("Nieprawidłowy adres email"),
  apiKey: z.string().min(1, "Klucz API jest wymagany"),
});

// 2. Внутренние интерфейсы AlfaCRM (структура их сервера, которую мы парсим)
export type GeneralIndexedResponse<T> = {
  total: number;
  count: number;
  page: number;
  items: T[];
};

export type AlfaUserInfoResponse = GeneralIndexedResponse<{
  id: number;
  email: string;
}>;

export type AlfaTeacher = {
  id: number;
  name: string;
  email?: string[];
  phone?: string[] | number[];
  avatarUrl?: string;
  [key: string]: any;
};

export type AlfaCrmSubject = {
  id: number;
  name: string;
  active: boolean;
  [key: string]: any;
};

export type ScheduleLesson = {
  day: number;
  time_from_v: string;
  time_to_v: string;
  subject_id: number;
  related_class: string;
  related_id: number;
  teacher_id: number;
  [key: string]: any;
};
