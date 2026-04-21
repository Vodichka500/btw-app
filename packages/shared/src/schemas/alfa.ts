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

export interface BillingSubject {
  id: number;
  quantity: number;
}

export interface AlfaBillingItem {
  alfaId: number;
  name: string;
  currentBalance: number;
  remainderAtStart: number;
  targetMonthCost: number;
  totalToPay: number;
  subjects: BillingSubject[];
}

export interface BillingReportResponse {
  items: AlfaBillingItem[];
  month: number;
  year: number;
  fetchedAt: number;
}

export interface AlfaLessonDetail {
  id: number;
  branch_id: number;
  customer_id: number;
  lesson_id: number;
  ctt_id: number | null;
  reason_id: number | null;
  reason_name: string;
  is_attend: number; // 1 - присутствовал, 0 - отсутствовал
  commission: string; // Приходит строкой, например "95.00"
  grade: string | number | null;
  homework_grade_id: number | null;
  bonus: number;
  note: string;
}

export interface AlfaLesson {
  id: number;
  branch_id: number;
  date: string; // Формат "YYYY-MM-DD"
  time_from: string; // Формат "YYYY-MM-DD HH:mm:ss"
  time_to: string; // Формат "YYYY-MM-DD HH:mm:ss"
  lesson_type_id: number;
  lesson_type_name: string; // Например, "Индивидуальный" или "Групповой"
  status: number; // 3 - проведенный
  subject_id: number;
  room_id: number | null;
  teacher_ids: number[];
  customer_ids: number[];
  group_ids: number[];
  streaming: boolean;
  note: string;
  topic: string;
  homework: string;
  created_at: string;
  updated_at: string;
  regular_id: number | null;
  details: AlfaLessonDetail[];
}