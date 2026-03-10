import { ipcMain } from 'electron'
import {
  AlfaCrmAuthInput,
  AlfaCrmAuthSchema,
  alfaSettings,
  AlfaTeacher,
  AlfaUserInfoResponse,
  UpdateTeachersResponse,
  isAuthResponse,
  Teacher,
  teachers,
  ApiResponse,
  TeacherCreateInput,
  GeneralIndexedResponse,
  ScheduleLesson,
  AlfaSubject,
} from '@btw-app/shared'
import { getDb } from '../lib/db'
import { AlfaCrmAuthResponse } from '@btw-app/shared'
import { eq } from 'drizzle-orm'

async function getAlfaCrmToken(email: string, apiKey: string): Promise<string> {
  const myHeaders = new Headers()
  myHeaders.append('Content-Type', 'application/json')

  const raw = JSON.stringify({
    email: email,
    api_key: apiKey
  })

  const requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw
  }

  const response: AlfaCrmAuthResponse = await fetch(
    'https://bridgetoworld.s20.online/v2api/auth/login',
    requestOptions
  )
    .then((response) => response.json())
    .catch((error) => console.error(error))

  return response.token
}

async function getAlfaUserInfoForLogin(
  token: string,
  email: string
): Promise<AlfaUserInfoResponse> {
  const headers = new Headers()
  headers.append('Content-Type', 'application/json')
  headers.append('X-ALFACRM-TOKEN', token)

  const requestOptions = {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      email
    })
  }

  const response: AlfaUserInfoResponse = await fetch(
    'https://bridgetoworld.s20.online/v2api/1/user/index',
    requestOptions
  )
    .then((response) => response.json())
    .catch((error) => console.error(error))

  return response
}

// --- Обновленный базовый загрузчик с защитой от Too Many Requests ---
async function makeAlfaCrmAuthRequest<Req, Res>(
  url: string,
  method: string = 'POST',
  body: Req,
  retries: number = 3 // Максимальное количество попыток
): Promise<Res> {
  const db = await getDb()
  const users = await db.select().from(alfaSettings).limit(1)

  if (users.length === 0) {
    throw new Error(
      'Użytkownik nie jest zalogowany w AlfaCRM. Brak danych uwierzytelniających w bazie.'
    )
  }

  let user = users[0]

  // Проверка и обновление токена
  if (!user.token || !user.tokenExpiresAt || new Date() > user.tokenExpiresAt) {
    const token = await getAlfaCrmToken(user.email, user.apiKey)
    if (!token)
      throw new Error('Nie udało się odświeżyć tokena AlfaCRM. Proszę zalogować się ponownie.')

    const newExpiry = new Date(Date.now() + 3600 * 1000)
    await db
      .update(alfaSettings)
      .set({ token, tokenExpiresAt: newExpiry })
      .where(eq(alfaSettings.id, user.id))
    user = { ...user, token, tokenExpiresAt: newExpiry }
  }

  const headers = new Headers({
    'Content-Type': 'application/json',
    'X-ALFACRM-TOKEN': user.token!
  })

  try {
    const response = await fetch(url, { method, headers, body: JSON.stringify(body) })

    // 🔥 ЗАЩИТА ОТ 429 TOO MANY REQUESTS
    if (response.status === 429) {
      if (retries > 0) {
        console.warn(
          `[AlfaCRM] Rate limit 429 hit for ${url}. Retrying... (${retries} attempts left)`
        )

        // Пытаемся прочитать заголовок Retry-After (если CRM его отдает), иначе ждем 2 секунды
        const retryAfter = response.headers.get('Retry-After')
        const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : 2000

        // Ждем...
        await new Promise((resolve) => setTimeout(resolve, waitTime))

        // ...и рекурсивно повторяем запрос
        return makeAlfaCrmAuthRequest(url, method, body, retries - 1)
      } else {
        throw new Error(`Przekroczono limit zapytań do AlfaCRM (429). Spróbuj ponownie później.`)
      }
    }

    // Если ошибка 5xx (например сервер прилег), тоже можно попробовать повторить
    if (!response.ok && response.status >= 500 && retries > 0) {
      console.warn(
        `[AlfaCRM] Server error ${response.status} for ${url}. Retrying... (${retries} attempts left)`
      )
      await new Promise((resolve) => setTimeout(resolve, 2000))
      return makeAlfaCrmAuthRequest(url, method, body, retries - 1)
    }

    if (!response.ok) {
      throw new Error(`AlfaCRM API Error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error: any) {
    // Если упал сам fetch (например, прервался интернет)
    if (
      retries > 0 &&
      error.message !==
        'Użytkownik nie jest zalogowany w AlfaCRM. Brak danych uwierzytelniających w bazie.'
    ) {
      console.warn(
        `[AlfaCRM] Network error: ${error.message}. Retrying... (${retries} attempts left)`
      )
      await new Promise((resolve) => setTimeout(resolve, 2000))
      return makeAlfaCrmAuthRequest(url, method, body, retries - 1)
    }
    throw error
  }
}

async function fetchAllAlfaPages<T>(url: string, baseParams: any = {}): Promise<T[]> {
  const allItems: T[] = []
  let page = 0
  let fetchedCount = 0
  let total = 0

  let res: GeneralIndexedResponse<T>
  do {
    res = await makeAlfaCrmAuthRequest<any, GeneralIndexedResponse<T>>(url, 'POST', {
      ...baseParams,
      page
    })

    if (!res || !res.items) break

    allItems.push(...res.items)
    fetchedCount += res.count
    total = res.total
    page++
  } while (fetchedCount < total && res.count > 0) // Ждем пока не скачаем весь total

  return allItems
}

function parseAlfaTime(timeFrom: string, timeTo: string) {
  const startParts = timeFrom.split(':')
  const endParts = timeTo.split(':')

  const startHour = parseInt(startParts[0], 10)
  const startMin = parseInt(startParts[1], 10)

  let endHour = parseInt(endParts[0], 10)
  let endMin = parseInt(endParts[1], 10)

  // Округляем 16:59:59 до 17:00
  if (endMin >= 59) {
    endHour += 1
    endMin = 0
  }

  let maxH = endHour
  if (endMin === 0) maxH -= 1

  return { startHour, startMin, endHour, endMin, maxH }
}

export const registerAlfaCrmIpcHandlers = async () => {
  ipcMain.handle(
    'alfa-crm:login',
    async (_, credentials: AlfaCrmAuthInput): Promise<ApiResponse<null>> => {
      const db = await getDb()
      const { email, apiKey } = AlfaCrmAuthSchema.parse(credentials)

      await db.delete(alfaSettings)

      const token = await getAlfaCrmToken(email, apiKey)

      if (!token) {
        return {
          success: false,
          error: 'Nie udało się uzyskać token AlfaCRM. Sprawdź email i klucz API.'
        }
      }

      const userInfo = await getAlfaUserInfoForLogin(token, email)

      if (userInfo.items.length === 0) {
        return {
          success: false,
          error:
            'Nie udało się pobrać informacji o użytkowniku z AlfaCRM. Proszę sprawdzić dane logowania.'
        }
      }

      await db.insert(alfaSettings).values({
        id: userInfo.items[0].id,
        email: email,
        apiKey: apiKey,
        token: token,
        tokenExpiresAt: new Date(Date.now() + 3600)
      })

      return { success: true, data: null }
    }
  )

  ipcMain.handle(
    'alfa-crm:update-teachers',
    async (): Promise<ApiResponse<UpdateTeachersResponse>> => {
      try {
        const db = await getDb()

        const alfaTeachers = await fetchAllAlfaPages<AlfaTeacher>(
          'https://bridgetoworld.s20.online/v2api/1/teacher/index',
          { removed: 0 }
        )
        console.log(alfaTeachers)

        // 2. Получаем текущих учителей из БД
        const dbTeachers = await db.select().from(teachers).all()

        // Делаем Map для быстрого поиска по alfacrmId: Map<alfacrmId, Teacher>
        const dbTeachersMap = new Map(dbTeachers.map((t) => [t.alfacrmId, t]))

        const newTeachers: TeacherCreateInput[] = []
        const teachersToUpdate: { id: number; data: Partial<TeacherCreateInput> }[] = []

        // 3. Сравниваем данные
        for (const alfa of alfaTeachers) {
          // Приводим данные AlfaCRM к формату нашей БД для корректного сравнения
          const formattedName = alfa.name
          const formattedEmail = alfa.email && alfa.email.length > 0 ? alfa.email.join(', ') : null
          const formattedPhone = alfa.phone ? String(alfa.phone) : null
          const formattedAvatar = alfa.avatarUrl || null

          const existingTeacher = dbTeachersMap.get(alfa.id)

          if (!existingTeacher) {
            // Если такого alfacrmId нет в базе — это новый препод
            newTeachers.push({
              alfacrmId: alfa.id,
              name: formattedName,
              email: formattedEmail,
              phone: formattedPhone,
              avatarUrl: formattedAvatar,
              note: 'Notatka'
            })
          } else {
            // Если есть — проверяем, изменилось ли хотя бы одно поле
            const hasChanges =
              existingTeacher.name !== formattedName ||
              existingTeacher.email !== formattedEmail ||
              existingTeacher.phone !== formattedPhone ||
              existingTeacher.avatarUrl !== formattedAvatar

            if (hasChanges) {
              // Сохраняем локальный id и новые данные для обновления
              teachersToUpdate.push({
                id: existingTeacher.id,
                data: {
                  name: formattedName,
                  email: formattedEmail,
                  phone: formattedPhone,
                  avatarUrl: formattedAvatar
                }
              })
            }
          }
        }

        // 4. Выполняем запись в БД

        // Вставляем новых пачкой
        if (newTeachers.length > 0) {
          await db.insert(teachers).values(newTeachers)
        }

        // Обновляем измененных через транзакцию (чтобы было быстро и безопасно)
        if (teachersToUpdate.length > 0) {
          await db.transaction(async (tx) => {
            for (const update of teachersToUpdate) {
              await tx.update(teachers).set(update.data).where(eq(teachers.id, update.id))
            }
          })
        }

        return {
          success: true,
          data: {
            status: 'success',
            added: newTeachers.length,
            updated: teachersToUpdate.length, // Добавили счетчик обновленных
            total: alfaTeachers.length
          }
        }
      } catch (error: any) {
        console.error(error)
        return {
          success: false,
          error: error.message || 'Bląd podczas aktualizacji nauczycieli z AlfaCRM'
        }
      }
    }
  )

  ipcMain.handle('alfa-crm:get-teachers', async (): Promise<ApiResponse<Teacher[]>> => {
    const db = await getDb()
    const teachersList = await db.select().from(teachers).all()
    if (!teachersList) {
      return { success: false, error: 'Nie udało się załadować nauczycieli z bazy danych.' }
    }
    return { success: true, data: teachersList }
  })

  ipcMain.handle('alfa-crm:check-auth', async (): Promise<ApiResponse<isAuthResponse>> => {
    try {
      const db = await getDb()
      const users = await db.select().from(alfaSettings).limit(1)

      // Если ключей нет - мы точно разлогинены, отдаем success, но isAuth: false
      if (users.length === 0) {
        return { success: true, data: { isAuth: false } }
      }

      const userSettings = await makeAlfaCrmAuthRequest<{ email: string }, AlfaUserInfoResponse>(
        'https://bridgetoworld.s20.online/v2api/1/user/index',
        'POST',
        { email: users[0].email }
      )

      if (!userSettings || !userSettings.items || userSettings.items.length === 0) {
        await db.delete(alfaSettings)
        return { success: true, data: { isAuth: false } }
      }

      return { success: true, data: { isAuth: true } }
    } catch (error: any) {
      console.error('Check Auth Error:', error)
      return { success: true, data: { isAuth: false } }
    }
  })

  ipcMain.handle('alfa-crm:logout', async (): Promise<ApiResponse<null>> => {
    const db = await getDb()
    await db.delete(alfaSettings)
    return { success: true, data: null }
  })

  ipcMain.handle(
    'alfa-crm:get-teacher-lessons',
    async (_, teacherAlfacrmId: number): Promise<ApiResponse<Record<string, any[]>>> => {
      try {
        const [regularLessons, alfaSubjects] = await Promise.all([
          fetchAllAlfaPages<ScheduleLesson>(
            'https://bridgetoworld.s20.online/v2api/1/regular-lesson/index',
            { teacher_id: teacherAlfacrmId }
          ),
          fetchAllAlfaPages<AlfaSubject>('https://bridgetoworld.s20.online/v2api/1/subject/index', {
            active: true
          })
        ])

        const subjectMap = new Map(alfaSubjects.map((s) => [s.id, s.name]))
        const customerIds = new Set<number>()
        const groupIds = new Set<number>()

        regularLessons.forEach((lesson) => {
          if (lesson.related_class === 'Customer') customerIds.add(lesson.related_id)
          if (lesson.related_class === 'Group') groupIds.add(lesson.related_id)
        })

        let customers: any[] = []
        let groups: any[] = []

        if (customerIds.size > 0) {
          customers = await fetchAllAlfaPages<any>(
            'https://bridgetoworld.s20.online/v2api/1/customer/index',
            { id: Array.from(customerIds) }
          )
        }
        if (groupIds.size > 0) {
          groups = await fetchAllAlfaPages<any>(
            'https://bridgetoworld.s20.online/v2api/1/group/index',
            { id: Array.from(groupIds) }
          )
        }

        const customerMap = new Map(customers.map((c) => [c.id, c.name]))
        const groupMap = new Map(groups.map((g) => [g.id, g.name]))

        const lessonsMap: Record<string, any[]> = {}
        const getCell = (d: number, h: number) => {
          const key = `${d}-${h}`
          if (!lessonsMap[key]) lessonsMap[key] = []
          return lessonsMap[key]
        }

        regularLessons.forEach((lesson) => {
          const dayIndex = lesson.day - 1 // 1(Пн) -> 0(Пн)
          const { startHour, startMin, endHour, endMin } = parseAlfaTime(
            lesson.time_from_v,
            lesson.time_to_v
          )

          const subjectName =
            subjectMap.get(lesson.subject_id) || `Przedmiot ID:${lesson.subject_id}`
          let studentStr = ''
          if (lesson.related_class === 'Group')
            studentStr = groupMap.get(lesson.related_id) || `Grupa #${lesson.related_id}`
          if (lesson.related_class === 'Customer')
            studentStr = customerMap.get(lesson.related_id) || `Klient #${lesson.related_id}`

          // 🔥 БОЛЬШЕ НИКАКИХ ЦИКЛОВ! Кладем урок ТОЛЬКО в ячейку старта (startHour)
          const cell = getCell(dayIndex, startHour)

          cell.push({
            subject: subjectName,
            student: studentStr,
            timeFrom: lesson.time_from_v.slice(0, 5),
            timeTo: lesson.time_to_v.slice(0, 5)
          })
        })

        return { success: true, data: lessonsMap }
      } catch (error: any) {
        console.error(error)
        return { success: false, error: error.message || 'Błąd podczas pobierania lekcji' }
      }
    }
  )
}
