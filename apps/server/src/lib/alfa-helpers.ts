// 1. Получение временного токена
import { GeneralIndexedResponse } from "@btw-app/shared";
import { TRPCError } from "@trpc/server";

export async function getAlfaCrmToken(email: string, apiKey: string): Promise<string> {
  const response = await fetch(
    "https://bridgetoworld.s20.online/v2api/auth/login",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, api_key: apiKey }),
    },
  );

  if (!response.ok) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Błąd autoryzacji w AlfaCRM. Sprawdź email i klucz API.",
    });
  }

  const data = await response.json();
  return data.token;
}

// 2. Универсальный запрос к AlfaCRM (теперь принимает токен напрямую!)
export async function makeAlfaCrmAuthRequest<Req, Res>(
  token: string,
  url: string,
  method: string = "POST",
  body: Req,
  retries: number = 3,
): Promise<Res> {
  const headers = new Headers({
    "Content-Type": "application/json",
    "X-ALFACRM-TOKEN": token,
  });

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(body),
    });

    if (response.status === 401) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Token AlfaCRM wygasł lub jest nieprawidłowy.",
      });
    }

    if (response.status === 429 && retries > 0) {
      console.warn(
        `[AlfaCRM] Rate limit 429 hit. Retrying... (${retries} left)`,
      );
      const retryAfter = response.headers.get("Retry-After");
      const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : 2000;
      await new Promise((r) => setTimeout(r, waitTime));
      return makeAlfaCrmAuthRequest(token, url, method, body, retries - 1);
    }

    if (!response.ok && response.status >= 500 && retries > 0) {
      await new Promise((r) => setTimeout(r, 2000));
      return makeAlfaCrmAuthRequest(token, url, method, body, retries - 1);
    }

    if (!response.ok) throw new Error(`AlfaCRM API Error: ${response.status}`);
    return await response.json();
  } catch (error: any) {
    if (retries > 0 && !(error instanceof TRPCError)) {
      await new Promise((r) => setTimeout(r, 2000));
      return makeAlfaCrmAuthRequest(token, url, method, body, retries - 1);
    }
    throw error;
  }
}

// 3. Стягивание всех страниц (принимает токен)
export async function fetchAllAlfaPages<T>(
  token: string,
  url: string,
  baseParams: any = {},
): Promise<T[]> {
  const allItems: T[] = [];
  let page = 0;
  let fetchedCount = 0;
  let total = 0;
  let res: GeneralIndexedResponse<T>;

  do {
    res = await makeAlfaCrmAuthRequest<any, GeneralIndexedResponse<T>>(
      token,
      url,
      "POST",
      { ...baseParams, page },
    );
    if (!res || !res.items) break;

    allItems.push(...res.items);
    fetchedCount += res.count;
    total = res.total;
    page++;
  } while (fetchedCount < total && res.count > 0);

  return allItems;
}

// 4. Парсинг времени (без изменений)
export function parseAlfaTime(timeFrom: string, timeTo: string) {
  const startParts = timeFrom.split(":");
  const endParts = timeTo.split(":");

  const startHour = parseInt(startParts[0], 10);
  const startMin = parseInt(startParts[1], 10);

  let endHour = parseInt(endParts[0], 10);
  let endMin = parseInt(endParts[1], 10);

  if (endMin >= 59) {
    endHour += 1;
    endMin = 0;
  }

  let maxH = endHour;
  if (endMin === 0) maxH -= 1;

  return { startHour, startMin, endHour, endMin, maxH };
}
