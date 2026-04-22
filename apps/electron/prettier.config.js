/** @type {import('prettier').Config} */
module.exports = {
  endOfLine: 'lf',
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  // Подключаем плагин
  plugins: ['@ianvs/prettier-plugin-sort-imports'],
  // Настраиваем порядок сортировки
  importOrder: [
    '^(react/(.*)$)|^(react$)', // Сначала сам React
    '<THIRD_PARTY_MODULES>', // Все остальные NPM пакеты (zod, lucide-react и т.д.)
    '', // Пустая строка для визуального разделения
    '^@/lib/(.*)$', // Твои утилиты и API (trpc)
    '^@/store/(.*)$', // Твои сторы (Zustand)
    '^@/components/(.*)$', // Твои компоненты
    '^@/(.*)$', // Остальные абсолютные импорты
    '',
    '^[./]', // Относительные импорты (файлы из текущей папки)
    '',
    '^(?!.*[.]css$)[./].*$',
    '.css$' // В самом конце - стили
  ],
  importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy'],
  importOrderTypeScriptVersion: '5.0.0'
}
