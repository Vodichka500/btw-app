"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var better_sqlite3_1 = require("better-sqlite3");
var index_1 = require("./index"); // Проверь правильность пути до твоей Призмы
var bcryptjs_1 = require("bcryptjs");
// 1. Пути к базам данных
// Укажи точное имя твоего старого файла БД
var OLD_DB_PATH = "./clippy.db";
// Подключаемся к VPS (обрати внимание на порт 5434, который мы открыли наружу)
var PROD_DB_URL = "postgresql://root:btw_app_2025@37.252.19.252:5434/btw_db?schema=public";
var sqlite = new better_sqlite3_1.default(OLD_DB_PATH);
// Утилиты для конвертации форматов SQLite -> PostgreSQL
var toDate = function (val) { return (val ? new Date(val) : null); };
var toBool = function (val) { return val === 1; };
var toJson = function (val) {
    if (!val)
        return [];
    try {
        return JSON.parse(val);
    }
    catch (_a) {
        return [];
    }
};
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var adminEmail, adminPassword, existingAdmin, hashedPassword, user, oldCategories, _i, oldCategories_1, cat, exists, oldSnippets, _a, oldSnippets_1, snip, exists, oldSettings, _b, oldSettings_1, set, exists, subjects, _c, subjects_1, sub, exists, teachers, _d, teachers_1, t, exists, teacherSubjects, _e, teacherSubjects_1, ts, exists, workingHours, _f, workingHours_1, wh, exists, error_1;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    console.log("🚀 Начинаем миграцию...");
                    _g.label = 1;
                case 1:
                    _g.trys.push([1, 43, 44, 46]);
                    // ==========================================
                    // 1. СОЗДАНИЕ ПЕРВОГО АДМИНА (Better Auth)
                    // ==========================================
                    console.log("👤 Создаем первого пользователя...");
                    adminEmail = "ya.vasileuskaya@gmail.com";
                    adminPassword = "Vodichka_500";
                    return [4 /*yield*/, index_1.db.user.findUnique({
                            where: { email: adminEmail },
                        })];
                case 2:
                    existingAdmin = _g.sent();
                    if (!!existingAdmin) return [3 /*break*/, 6];
                    return [4 /*yield*/, bcryptjs_1.default.hash(adminPassword, 10)];
                case 3:
                    hashedPassword = _g.sent();
                    return [4 /*yield*/, index_1.db.user.create({
                            data: {
                                email: adminEmail,
                                name: "Главный Админ",
                                role: "ADMIN",
                                emailVerified: true,
                                createdAt: new Date(),
                                updatedAt: new Date(),
                            },
                        })];
                case 4:
                    user = _g.sent();
                    // В Better Auth пароли лежат в таблице Account
                    return [4 /*yield*/, index_1.db.account.create({
                            data: {
                                id: "acc_".concat(Date.now()),
                                accountId: adminEmail,
                                providerId: "credential",
                                userId: user.id,
                                password: hashedPassword,
                                createdAt: new Date(),
                                updatedAt: new Date(),
                            },
                        })];
                case 5:
                    // В Better Auth пароли лежат в таблице Account
                    _g.sent();
                    console.log("\u2705 \u0410\u0434\u043C\u0438\u043D \u0441\u043E\u0437\u0434\u0430\u043D! \u041B\u043E\u0433\u0438\u043D: ".concat(adminEmail, " | \u041F\u0430\u0440\u043E\u043B\u044C: ").concat(adminPassword));
                    return [3 /*break*/, 7];
                case 6:
                    console.log("⚠️ Админ уже существует, пропускаем.");
                    _g.label = 7;
                case 7:
                    // ==========================================
                    // 2. МИГРАЦИЯ КАТЕГОРИЙ
                    // ==========================================
                    console.log("📦 Переносим категории...");
                    oldCategories = sqlite
                        .prepare("SELECT * FROM categories ORDER BY parent_id ASC")
                        .all();
                    _i = 0, oldCategories_1 = oldCategories;
                    _g.label = 8;
                case 8:
                    if (!(_i < oldCategories_1.length)) return [3 /*break*/, 12];
                    cat = oldCategories_1[_i];
                    return [4 /*yield*/, index_1.db.category.findUnique({
                            where: { id: cat.id },
                        })];
                case 9:
                    exists = _g.sent();
                    if (!!exists) return [3 /*break*/, 11];
                    return [4 /*yield*/, index_1.db.category.create({
                            data: {
                                id: cat.id,
                                name: cat.name,
                                order: cat.order,
                                parentId: cat.parent_id,
                                createdAt: toDate(cat.created_at) || new Date(),
                                deletedAt: toDate(cat.deleted_at),
                            },
                        })];
                case 10:
                    _g.sent();
                    _g.label = 11;
                case 11:
                    _i++;
                    return [3 /*break*/, 8];
                case 12:
                    console.log("\u2705 \u041A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438: ".concat(oldCategories.length, " \u0448\u0442."));
                    // ==========================================
                    // 3. МИГРАЦИЯ СНИППЕТОВ
                    // ==========================================
                    console.log("📄 Переносим сниппеты...");
                    oldSnippets = sqlite.prepare("SELECT * FROM snippets").all();
                    _a = 0, oldSnippets_1 = oldSnippets;
                    _g.label = 13;
                case 13:
                    if (!(_a < oldSnippets_1.length)) return [3 /*break*/, 17];
                    snip = oldSnippets_1[_a];
                    return [4 /*yield*/, index_1.db.snippet.findUnique({
                            where: { id: snip.id },
                        })];
                case 14:
                    exists = _g.sent();
                    if (!!exists) return [3 /*break*/, 16];
                    return [4 /*yield*/, index_1.db.snippet.create({
                            data: {
                                id: snip.id,
                                title: snip.title,
                                body: snip.body,
                                variables: toJson(snip.variables),
                                categoryId: snip.category_id,
                                favorite: toBool(snip.favorite),
                                color: snip.color,
                                order: snip.order,
                                createdAt: toDate(snip.created_at) || new Date(),
                                updatedAt: toDate(snip.updated_at) || new Date(),
                                deletedAt: toDate(snip.deleted_at),
                            },
                        })];
                case 15:
                    _g.sent();
                    _g.label = 16;
                case 16:
                    _a++;
                    return [3 /*break*/, 13];
                case 17:
                    console.log("\u2705 \u0421\u043D\u0438\u043F\u043F\u0435\u0442\u044B: ".concat(oldSnippets.length, " \u0448\u0442."));
                    // ==========================================
                    // 4. ALFA SETTINGS
                    // ==========================================
                    console.log("⚙️ Переносим настройки Alfa...");
                    oldSettings = sqlite
                        .prepare("SELECT * FROM alfa_settings")
                        .all();
                    _b = 0, oldSettings_1 = oldSettings;
                    _g.label = 18;
                case 18:
                    if (!(_b < oldSettings_1.length)) return [3 /*break*/, 22];
                    set = oldSettings_1[_b];
                    return [4 /*yield*/, index_1.db.alfaSettings.findUnique({
                            where: { id: set.id },
                        })];
                case 19:
                    exists = _g.sent();
                    if (!!exists) return [3 /*break*/, 21];
                    return [4 /*yield*/, index_1.db.alfaSettings.create({
                            data: {
                                id: set.id,
                                email: set.email,
                                apiKey: set.api_key,
                                token: set.token,
                                tokenExpiresAt: toDate(set.token_expires_at),
                            },
                        })];
                case 20:
                    _g.sent();
                    _g.label = 21;
                case 21:
                    _b++;
                    return [3 /*break*/, 18];
                case 22:
                    console.log("\u2705 \u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 Alfa: ".concat(oldSettings.length, " \u0448\u0442."));
                    // ==========================================
                    // 5. ПРЕДМЕТЫ И ПРЕПОДАВАТЕЛИ
                    // ==========================================
                    console.log("👨‍🏫 Переносим предметы и преподавателей...");
                    subjects = sqlite.prepare("SELECT * FROM subjects").all();
                    _c = 0, subjects_1 = subjects;
                    _g.label = 23;
                case 23:
                    if (!(_c < subjects_1.length)) return [3 /*break*/, 27];
                    sub = subjects_1[_c];
                    return [4 /*yield*/, index_1.db.subject.findUnique({ where: { id: sub.id } })];
                case 24:
                    exists = _g.sent();
                    if (!!exists) return [3 /*break*/, 26];
                    return [4 /*yield*/, index_1.db.subject.create({
                            data: {
                                id: sub.id,
                                alfacrmId: sub.alfacrm_id,
                                name: sub.name,
                                order: sub.order,
                            },
                        })];
                case 25:
                    _g.sent();
                    _g.label = 26;
                case 26:
                    _c++;
                    return [3 /*break*/, 23];
                case 27:
                    teachers = sqlite.prepare("SELECT * FROM teachers").all();
                    _d = 0, teachers_1 = teachers;
                    _g.label = 28;
                case 28:
                    if (!(_d < teachers_1.length)) return [3 /*break*/, 32];
                    t = teachers_1[_d];
                    return [4 /*yield*/, index_1.db.teacher.findUnique({ where: { id: t.id } })];
                case 29:
                    exists = _g.sent();
                    if (!!exists) return [3 /*break*/, 31];
                    return [4 /*yield*/, index_1.db.teacher.create({
                            data: {
                                id: t.id,
                                alfacrmId: t.alfacrm_id,
                                name: t.name,
                                email: t.email,
                                phone: t.phone,
                                avatarUrl: t.avatar_url,
                                note: t.note,
                            },
                        })];
                case 30:
                    _g.sent();
                    _g.label = 31;
                case 31:
                    _d++;
                    return [3 /*break*/, 28];
                case 32:
                    teacherSubjects = sqlite
                        .prepare("SELECT * FROM teacher_subjects")
                        .all();
                    _e = 0, teacherSubjects_1 = teacherSubjects;
                    _g.label = 33;
                case 33:
                    if (!(_e < teacherSubjects_1.length)) return [3 /*break*/, 37];
                    ts = teacherSubjects_1[_e];
                    return [4 /*yield*/, index_1.db.teacherSubject.findUnique({
                            where: {
                                teacherId_subjectId: {
                                    teacherId: ts.teacher_id,
                                    subjectId: ts.subject_id,
                                },
                            },
                        })];
                case 34:
                    exists = _g.sent();
                    if (!!exists) return [3 /*break*/, 36];
                    return [4 /*yield*/, index_1.db.teacherSubject.create({
                            data: { teacherId: ts.teacher_id, subjectId: ts.subject_id },
                        })];
                case 35:
                    _g.sent();
                    _g.label = 36;
                case 36:
                    _e++;
                    return [3 /*break*/, 33];
                case 37:
                    workingHours = sqlite
                        .prepare("SELECT * FROM teacher_working_hours")
                        .all();
                    _f = 0, workingHours_1 = workingHours;
                    _g.label = 38;
                case 38:
                    if (!(_f < workingHours_1.length)) return [3 /*break*/, 42];
                    wh = workingHours_1[_f];
                    return [4 /*yield*/, index_1.db.teacherWorkingHour.findUnique({
                            where: { id: wh.id },
                        })];
                case 39:
                    exists = _g.sent();
                    if (!!exists) return [3 /*break*/, 41];
                    return [4 /*yield*/, index_1.db.teacherWorkingHour.create({
                            data: {
                                id: wh.id,
                                teacherId: wh.teacher_id,
                                dayIndex: wh.day_index,
                                timeFrom: wh.time_from,
                                timeTo: wh.time_to,
                            },
                        })];
                case 40:
                    _g.sent();
                    _g.label = 41;
                case 41:
                    _f++;
                    return [3 /*break*/, 38];
                case 42:
                    console.log("✅ Обучение и расписание перенесено!");
                    console.log("\n🎉 МИГРАЦИЯ УСПЕШНО ЗАВЕРШЕНА! 🎉");
                    return [3 /*break*/, 46];
                case 43:
                    error_1 = _g.sent();
                    console.error("❌ ОШИБКА ПРИ МИГРАЦИИ:", error_1);
                    return [3 /*break*/, 46];
                case 44: return [4 /*yield*/, index_1.db.$disconnect()];
                case 45:
                    _g.sent();
                    sqlite.close();
                    return [7 /*endfinally*/];
                case 46: return [2 /*return*/];
            }
        });
    });
}
main();
