import fs from "fs";
import path from "path";
import readline from "readline";

// Настраиваем интерфейс для ввода/вывода в консоли
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Утилита для удобных вопросов через async/await
const ask = (query) => new Promise((resolve) => rl.question(query, resolve));

// Пути к нашим файлам
const files = {
  electron: "./apps/electron/package.json",
  server: "./apps/server/package.json",
  meta: "./apps/server/src/routers/meta.ts",
};

async function main() {
  console.log("🚀 Интерактивное обновление версий BTW App\n");

  try {
    // 1. Читаем текущие версии из файлов
    const electronPkg = JSON.parse(fs.readFileSync(files.electron, "utf8"));
    const serverPkg = JSON.parse(fs.readFileSync(files.server, "utf8"));
    let metaContent = fs.readFileSync(files.meta, "utf8");

    const currentClient = electronPkg.version;
    const currentServer = serverPkg.version;

    // Достаем минимальную версию регуляркой
    const minClientMatch = metaContent.match(
      /const MIN_REQUIRED_CLIENT_VERSION = "(.*?)";/,
    );
    const currentMinClient = minClientMatch ? minClientMatch[1] : "Неизвестно";

    // 2. Интерактивный опрос
    console.log(`Текущая версия сервера: ${currentServer}`);
    const inputServer = await ask(
      "Введите новую версию (или Enter, чтобы оставить текущую): ",
    );
    const newServer = inputServer.trim() || currentServer;

    console.log(`\nТекущая версия клиента (Electron): ${currentClient}`);
    const inputClient = await ask(
      "Введите новую версию (или Enter, чтобы оставить текущую): ",
    );
    const newClient = inputClient.trim() || currentClient;

    console.log(`\nТекущая минимальная версия клиента: ${currentMinClient}`);
    const inputMinClient = await ask(
      "Введите новую версию (или Enter, чтобы пропустить): ",
    );
    const newMinClient = inputMinClient.trim() || currentMinClient;

    // 3. Сохраняем изменения
    console.log("\n⚙️ Применяем изменения...");

    // Обновляем package.json
    serverPkg.version = newServer;
    fs.writeFileSync(files.server, JSON.stringify(serverPkg, null, 2) + "\n");

    electronPkg.version = newClient;
    fs.writeFileSync(
      files.electron,
      JSON.stringify(electronPkg, null, 2) + "\n",
    );

    // Обновляем meta.ts
    metaContent = metaContent.replace(
      /const CURRENT_CLIENT_VERSION = ".*?";/,
      `const CURRENT_CLIENT_VERSION = "${newClient}";`,
    );
    metaContent = metaContent.replace(
      /const CURRENT_SERVER_VERSION = ".*?";/,
      `const CURRENT_SERVER_VERSION = "${newServer}";`,
    );
    metaContent = metaContent.replace(
      /const MIN_REQUIRED_CLIENT_VERSION = ".*?";/,
      `const MIN_REQUIRED_CLIENT_VERSION = "${newMinClient}";`,
    );
    fs.writeFileSync(files.meta, metaContent);

    // 4. Финал и кликабельные ссылки
    // Форматируем пути как file:/// для кликабельности в VS Code
    const makeClickable = (relPath) =>
      `file:///${path.resolve(relPath).replace(/\\/g, "/")}`;

    console.log("\n✅ Успешно обновлено!");
    console.log("Откройте эти файлы и проверьте правильность:");
    console.log(`1. Server:   ${makeClickable(files.server)}`);
    console.log(`2. Electron: ${makeClickable(files.electron)}`);
    console.log(`3. Meta Route: ${makeClickable(files.meta)}\n`);
  } catch (error) {
    console.error("\n❌ Ошибка при обновлении версий:", error.message);
  } finally {
    rl.close();
  }
}

main();
