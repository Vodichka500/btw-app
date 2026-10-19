
## Локальная разработка
1. Пулим репо с гитхаб
2. создаем .env файл в ./apps/server/ (пример ./apps/server/.env.example)
3. pnpn install
4. docker compose up -d
5. pnpm run db:migrate
6. pnpm run dev:server
7. Через постман создаем (регистрируем) первого пользователя [Такая регистрация доступна только  локально]
   
```
- Method: POST
- URL: http://localhost:3000/api/auth/sign-up/email
- Header: Content-Type: application/json
- Body → raw → JSON:
{
  "email": "admin@admin.admin",
  "password": "admin123",
  "name": "Local Admin",
  "role": "ADMIN"
}
```

8. pnpm run dev:electron

## Релиз новой версии BTW
### Релиз сервера
1. Создать новую ветку: `git checkout -b branch_name`
2. Сделать миграции БД (если были изменения: `npx prisma migrate dev`)
3. Сделать prisma genetate
4. Запустить `bump-version.mjs` и ответить на вопросы скрипта*.
   * Легче всего обновить все 3 версии типа:
     * client 0.1.0 &rarr; 0.2.0
     * server 1.2.0 &rarr; 1.3.0
     * min client ver: 0.1.0 &rarr; 0.2.0
5. Закоммитить все
6. Запустить `pnpm build` и проверить, что все ок
7. Запустить докер (сервер + база) и `pnpm run dev:electron`: проверить из dev что все ок
8. Запушить ветку и создать **Pull Request** на GitHub.
9.  Убедиться, что сервер обновился автоматически (CI/CD).
10. Проверить работает ли контейнер с логами
    * Если нет: Сгенерить пароль и логин для логов
    * `docker run --rm amir20/dozzle generate btw --password admin > dozzle-users.yml`
### Релиз клиента
11. Добавиль GitHub токен в PowerShell.
    * `$env:GITHUB_TOKEN=""`
12. Запустить релиз
    * `pnpm run release`
13. **Обязательно** запушить апку в RELEASES и поставить тег **relase** а не draft
    

