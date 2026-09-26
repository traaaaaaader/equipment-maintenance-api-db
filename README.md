# Equipment Maintenance API

REST API на Express 5 + TypeScript для учёта оборудования производственной площадки
и заявок на его техническое обслуживание. Сервис контролирует жизненный цикл заявки
(допустимые переходы статуса) и позволяет оценить погодные условия на объекте перед 
планированием наружных работ через внешний погодный API.

## Содержание

- [Требования к окружению](#требования-к-окружению)
- [Установка и запуск](#установка-и-запуск)
- [Запуск через Docker](#запуск-через-docker)
- [Переменные окружения](#переменные-окружения)
- [Архитектура и структура проекта](#архитектура-и-структура-проекта)
- [Модель данных](#модель-данных)
- [Переходы статуса заявки](#переходы-статуса-заявки)
- [Состав API](#состав-api)
- [Формат ответа](#формат-ответа)
- [Формат ответа об ошибке](#формат-ответа-об-ошибке)
- [Примеры запросов и ответов](#примеры-запросов-и-ответов)
- [Погодный сервис и пригодность окна для работ](#погодный-сервис-и-пригодность-окна-для-работ)
- [Политики безопасности](#политики-безопасности)
- [Логирование](#логирование)
- [Порядок middleware и почему он именно такой](#порядок-middleware-и-почему-он-именно-такой)
- [Аутентификация по API-ключу (бонус)](#аутентификация-по-api-ключу-бонус)
- [Тестирование (бонус)](#тестирование-бонус)
- [Postman](#postman)
- [Git-флоу](#git-флоу)

## Требования к окружению

- Node.js ≥ 20 (Express 5 требует Node ≥ 18)
- npm ≥ 10
- Docker + Docker Compose — опционально, для контейнерного запуска
- Доступ в интернет — для эндпоинта прогноза погоды (внешний API Open-Meteo, ключ не требуется)

## Установка и запуск

```bash
npm install
cp .env.example .env
npm run start:dev   # разработка, автоперезапуск (nodemon + tsx)
# либо
npm run build && npm start   # сборка в dist/ и запуск скомпилированного кода
```

Сервер поднимается на `http://localhost:3000` (порт настраивается через `PORT`).
Проверка: `curl http://localhost:3000/api/health`.

Данные хранятся в памяти процесса (`Map` в слое репозиториев, `src/repositories/`).

## Запуск через Docker

```bash
cp .env.example .env
docker compose up --build
```

Сборка — multi-stage (`Dockerfile`): первый слой ставит все зависимости и компилирует
TypeScript (`npm run build`), второй — чистый рантайм-образ только с прод-зависимостями и
готовым `dist/`, запускается от непривилегированного пользователя `node`. Compose поднимает
единственный сервис `api`, пробрасывает порт (`PORT`, по умолчанию 3000), читает переменные
окружения из `.env` (`env_file`), но принудительно выставляет `NODE_ENV=production` поверх
него — иначе логгер попытался бы подключить `pino-pretty` (это dev-зависимость, которой нет
в прод-образе). Настроен `HEALTHCHECK` по `/api/health` — и на уровне Dockerfile (для запуска
без compose), и в `docker-compose.yaml`.

## Переменные окружения

Полный список — в [`.env.example`](.env.example).
Конфигурация читается и валидируется в `src/config/` (Zod-схема, `src/config/env.schema.ts`).

| Переменная | Назначение | Значение по умолчанию |
|---|---|---|
| `PORT` | порт HTTP-сервера | `3000` |
| `NODE_ENV` | режим окружения (`development` / `production` / `test`) | `development` |
| `CORS_ORIGINS` | список разрешённых CORS-origin через запятую | `http://localhost:3000` |
| `RATE_LIMIT_WINDOW_MS` | окно ограничения частоты запросов, мс | `60000` |
| `RATE_LIMIT_MAX` | максимум запросов на IP за окно | `100` |
| `WEATHER_API_URL` | адрес внешнего погодного API | `https://api.open-meteo.com/v1/forecast` |
| `REQUEST_TIMEOUT_MS` | таймаут обращения к погодному API, мс | `5000` |
| `WEATHER_MAX_WIND_KMH` | порог скорости ветра для пригодности окна работ | `40` |
| `BODY_LIMIT` | максимальный размер тела запроса | `100kb` |
| `API_KEYS` | список API-ключей через запятую (бонус, см. ниже); пусто — проверка выключена | *(пусто)* |
| `LOG_LEVEL` | уровень логирования pino | `info` |

## Архитектура и структура проекта

Слоистая архитектура: **маршруты → контроллеры → сервисы → репозитории**.

```
src/
  app.ts                   # сборка Express-приложения (createApp(), без listen) — используется и в тестах
  index.ts                 # точка входа: createApp().listen(...), graceful shutdown
  config/                  # чтение и валидация переменных окружения (Zod)
  routes/                  # маршруты: путь + HTTP-метод + validate() + controller
  controllers/             # разбор req.valid → вызов сервиса → HTTP-ответ
  services/                # бизнес-правила: уникальность, переходы статуса, погодный сервис
  repositories/            # доступ к данным (in-memory Map), изолирован интерфейсом
  models/                  # доменные типы и enum'ы (Equipment, MaintenanceRequest)
  validators/               # Zod-схемы для body/params/query
  middlewares/              # requestId, http-логирование, валидация, rate limit, auth, 404, errors
  errors/                   # собственные типы ошибок (не привязаны к Express)
  utils/                    # логгер (pino), AsyncLocalStorage-контекст запроса
tests/                       # Jest + Supertest (бонус)
docs/postman/                 # экспортированная коллекция и окружение Postman
```

Сборка приложения (`createApp()` в `src/app.ts`) отделена от запуска сервера (`src/index.ts`):
`createApp()` не вызывает `listen()` и подключается в тестах напрямую через `supertest(createApp())`.

Погодный модуль (`src/services/weatherService.ts`) выделен как отдельный сервис.
Сервис оборудования обращается к нему через обычный импорт функции `getForecastForLocation`.

## Модель данных

### Оборудование (`equipment`)

| Поле | Тип | Описание |
|---|---|---|
| `id` | string (uuid) | генерируется сервером |
| `name` | string, 3–100 символов | обязательное |
| `type` | enum | `turbine` \| `inverter` \| `sensor` \| `substation` |
| `serialNumber` | string | уникален в пределах системы |
| `location` | `{ lat: number, lon: number }` | координаты объекта |
| `status` | enum | `operational` \| `maintenance` \| `fault` \| `decommissioned` (по умолчанию `operational`) |
| `installedAt` | ISO-дата | не в будущем |
| `createdAt`, `updatedAt` | ISO-дата-время | проставляются сервером |

### Заявка на обслуживание (`maintenance request`)

| Поле | Тип | Описание |
|---|---|---|
| `id` | string (uuid) | генерируется сервером |
| `equipmentId` | string | ссылка на существующее оборудование |
| `title` | string, 5–120 символов | обязательное |
| `description` | string, до 2000 символов | необязательное |
| `priority` | enum | `low` \| `medium` \| `high` \| `critical` |
| `status` | enum | `new` \| `in_progress` \| `done` \| `rejected` (по умолчанию `new`) |
| `plannedAt` | ISO-дата-время | необязательное |
| `createdAt`, `updatedAt` | ISO-дата-время | проставляются сервером |

Поля `id`, `createdAt`, `updatedAt` (а также `status` при создании) проставляются сервером и
не могут быть изменены клиентом напрямую: валидационные схемы построены так, что тело запроса
разбирается по явно перечисленным полям, а любые остальные ключи — молча отбрасываются
(`z.object()` без `.strict()`, поведение `.strip()` по умолчанию): неизвестные поля тела
запроса просто отбрасываются, не превращаясь в ошибку валидации.

## Переходы статуса заявки

```
new ───────► in_progress ───────► done
 │                │
 └──► rejected ◄──┘
```

Разрешено: `new → in_progress`, `new → rejected`, `in_progress → done`, `in_progress → rejected`.
Из `done` и `rejected` переходов нет — это терминальные статусы. Таблица переходов живёт в
сервисном слое (`src/services/requestStatusTransitions.ts`). Недопустимый переход отклоняется 
с кодом `409 CONFLICT`.

## Состав API

Базовый префикс — `/api`. Все ответы — JSON.

| Метод | Путь | Назначение | Auth |
|---|---|---|---|
| GET | `/api/health` | проверка доступности сервиса | — |
| GET | `/api/equipment` | список оборудования: фильтры, сортировка, пагинация | — |
| POST | `/api/equipment` | создание единицы оборудования | 🔑 |
| GET | `/api/equipment/:id` | карточка оборудования | — |
| PATCH | `/api/equipment/:id` | частичное обновление | 🔑 |
| DELETE | `/api/equipment/:id` | удаление (запрещено при открытых заявках) | 🔑 |
| GET | `/api/equipment/:id/requests` | заявки по конкретной единице оборудования | — |
| GET | `/api/equipment/:id/weather` | прогноз погоды и пригодность окна для наружных работ | — |
| GET | `/api/requests` | список заявок: фильтры, сортировка, пагинация | — |
| POST | `/api/requests` | создание заявки | 🔑 |
| GET | `/api/requests/:id` | карточка заявки | — |
| PATCH | `/api/requests/:id` | редактирование полей заявки | 🔑 |
| PATCH | `/api/requests/:id/status` | смена статуса с проверкой допустимости перехода | 🔑 |
| DELETE | `/api/requests/:id` | удаление заявки | 🔑 |

🔑 — требует заголовок `X-API-Key`, если на сервере задана переменная `API_KEYS` (см.
[Аутентификация по API-ключу](#аутентификация-по-api-ключу-бонус)).

### Query-параметры списочных эндпоинтов

Общие: `page` (по умолчанию 1), `limit` (по умолчанию 20, максимум 100), `sort` (имя поля,
префикс `-` — убывающий порядок, например `sort=-createdAt`).

- `GET /api/equipment`: `type`, `status`, `search` (по имени/серийному номеру). Поля сортировки:
  `name`, `installedAt`, `createdAt`, `status`, `type`.
- `GET /api/requests`: `status`, `priority`, `equipmentId`, `createdFrom`/`createdTo`,
  `plannedFrom`/`plannedTo` (диапазоны ISO-дат-времени). Поля сортировки: `createdAt`,
  `updatedAt`, `plannedAt`, `priority`, `status`.
- `GET /api/equipment/:id/requests` (вложенный ресурс): `status`, `priority`, `sort` — те же
  правила, но без `equipmentId` (он берётся из пути) и без диапазонов дат.

Некорректные значения параметров (например, `page=abc`, `status=unknown`) отклоняются
валидатором с кодом `422`.

## Формат ответа

Единая форма для всех успешных ответов:

```json
// один объект
{ "data": { "id": "…", "...": "..." } }
```

```json
// список
{
  "data": [ { "id": "…" }, { "id": "…" } ],
  "meta": { "total": 42, "page": 1, "limit": 20 }
}
```

Коды ответов: `200` — чтение/обновление, `201` — создание (с заголовком `Location`, указывающим
на созданный ресурс), `204` — удаление (без тела), `400` — синтаксически некорректное тело
запроса («битый» JSON, ошибка парсера `express.json()`), `401` — не пройдена аутентификация
по API-ключу, `403` — источник не разрешён политикой CORS, `404` — ресурс не найден, `409` —
конфликт состояния (дубль серийного номера, недопустимый переход статуса, удаление
оборудования с открытыми заявками), `413` — тело запроса превышает `BODY_LIMIT`, `422` —
тело/параметры не проходят схему валидации, `429` — превышен лимит частоты запросов, `503` —
внешний погодный API недоступен.

## Формат ответа об ошибке

Единый для всего API, формируется только в централизованном обработчике ошибок
(`src/middlewares/errorHandler.ts`):

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Некорректные данные запроса",
    "details": [
      { "field": "body.priority", "message": "priority должен быть одним из: low, medium, high, critical" }
    ],
    "requestId": "b1f2c3d4-1234-4a5b-9abc-1234567890ab"
  }
}
```

`requestId` есть в каждом ответе об ошибке и в заголовке `X-Request-Id` каждого ответа
(успешного тоже) — по нему запрос находится в логах сервера. `details` присутствует только
там, где есть что перечислить (ошибки валидации и часть конфликтов). В `production`
(`NODE_ENV=production`) в ответ никогда не попадают стек-трейсы и внутренние сообщения об
ошибках 5xx — только нейтральный текст и `requestId`; в `development` для 5xx дополнительно
добавляется `error.stack`, чтобы ускорить отладку.

Коды ошибок: `VALIDATION_ERROR` (422), `BAD_REQUEST` (400/413 — «битый» JSON или превышен
`BODY_LIMIT`), `UNAUTHORIZED` (401), `FORBIDDEN` (403, в т.ч. CORS), `NOT_FOUND` (404),
`CONFLICT` (409), `SERVICE_UNAVAILABLE` (503, недоступен внешний погодный API),
`RATE_LIMIT_EXCEEDED` (429), `INTERNAL_ERROR` (500).

## Примеры запросов и ответов

### Создание оборудования — успех

```
POST /api/equipment
X-API-Key: dev-secret-key
Content-Type: application/json

{
  "name": "Турбина №1",
  "type": "turbine",
  "serialNumber": "WT-0001",
  "location": { "lat": 55.7558, "lon": 37.6173 },
  "installedAt": "2022-03-15"
}
```

```
201 Created
Location: /api/equipment/83612cb9-ab37-417c-82d3-6fb511526970

{
  "data": {
    "id": "83612cb9-ab37-417c-82d3-6fb511526970",
    "name": "Турбина №1",
    "type": "turbine",
    "serialNumber": "WT-0001",
    "location": { "lat": 55.7558, "lon": 37.6173 },
    "status": "operational",
    "installedAt": "2022-03-15",
    "createdAt": "2026-09-20T12:00:00.000Z",
    "updatedAt": "2026-09-20T12:00:00.000Z"
  }
}
```

### Создание оборудования — ошибка валидации

```
POST /api/equipment
X-API-Key: dev-secret-key
Content-Type: application/json

{ "name": "X", "type": "drone" }
```

```
422 Unprocessable Entity

{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Некорректные данные запроса",
    "details": [
      { "field": "body.name", "message": "name: минимум 3 символа" },
      { "field": "body.type", "message": "type должен быть одним из: turbine, inverter, sensor, substation" },
      { "field": "body.serialNumber", "message": "Invalid input: expected string, received undefined" },
      { "field": "body.location", "message": "Invalid input: expected object, received undefined" },
      { "field": "body.installedAt", "message": "Ожидается ISO-8601 дата (YYYY-MM-DD)" }
    ],
    "requestId": "d7f070bc-3c0b-4a05-b56a-869ddc510067"
  }
}
```

### Недопустимый переход статуса

```
PATCH /api/requests/27d93c8b-eb35-49a1-a346-1a5c06217678/status
X-API-Key: dev-secret-key
Content-Type: application/json

{ "status": "done" }
```

```
409 Conflict

{
  "error": {
    "code": "CONFLICT",
    "message": "Недопустимый переход статуса: new -> done",
    "details": [ { "field": "status", "message": "Из статуса \"new\" переход в \"done\" запрещён" } ],
    "requestId": "1270c955-0d2b-4ddd-93d3-57cf2402459a"
  }
}
```

## Погодный сервис и пригодность окна для работ

`GET /api/equipment/:id/weather` берёт координаты оборудования, обращается к внешнему
погодному API [Open-Meteo](https://open-meteo.com/) (не требует API-ключа) и возвращает 
текущие погодные показатели вместе с флагом пригодности окна для наружных работ:

```json
{
  "data": {
    "location": { "lat": 55.7558, "lon": 37.6173 },
    "current": { "temperature_2m": 18.7, "precipitation": 0, "wind_speed_10m": 10.7 },
    "outdoorWorkWindow": {
      "suitable": true,
      "reasons": [],
      "thresholds": { "maxWindKmh": 40 }
    }
  }
}
```

Правило пригодности (задаётся в конфигурации, переменная `WEATHER_MAX_WIND_KMH`): **отсутствие
осадков и скорость ветра ниже порога**. Если правило не выполняется, `suitable: false`, а
`reasons` перечисляет, какое именно условие нарушено.

Недоступность или ошибка внешнего API **не приводит к падению сервиса**: любая проблема
(таймаут, сетевая ошибка, `5xx`/некорректный ответ у Open-Meteo) оборачивается в
`WeatherServiceError` и обрабатывается тем же централизованным обработчиком ошибок, возвращая
клиенту `503 SERVICE_UNAVAILABLE` с понятным сообщением, а не необработанное исключение.

## Политики безопасности

- **CORS** — явный список разрешённых источников из `CORS_ORIGINS` (никогда `*`). По умолчанию
  разрешён только `http://localhost:3000`; для фронтенда, задеплоенного отдельно, впишите его
  адрес через запятую. Разрешённые методы ограничены реально используемыми
  (`GET, POST, PATCH, DELETE`). Запрос с несогласованным `Origin` отклоняется с `403 FORBIDDEN`
  через тот же централизованный обработчик ошибок, а не generic-ответом библиотеки `cors`.
- **Rate limiting** — `express-rate-limit` на всех маршрутах `/api`: `RATE_LIMIT_MAX` запросов
  за `RATE_LIMIT_WINDOW_MS` на IP. При превышении — `429` с заголовками `RateLimit-*`
  (draft-7) и телом в едином формате ошибок API.
- **Ограничение размера тела** — `express.json({ limit: BODY_LIMIT })`, по умолчанию `100kb`:
  запрос с более крупным телом отклоняется до попадания в бизнес-логику (`413`).
- **Защитные заголовки** — `helmet()`. HSTS включается только при `NODE_ENV=production`:
  заголовок `Strict-Transport-Security` имеет смысл только при реальном HTTPS, а в разработке
  сервис работает по обычному HTTP, поэтому в dev-режиме заголовок не отправляется. Также явно
  отключён `X-Powered-By` (`app.disable('x-powered-by')`).
- **Секреты** — не хранятся в репозитории: `.env` в `.gitignore`, в коде только чтение из
  `process.env` через `src/config`. В `.env.example` — только безопасные значения по умолчанию,
  `API_KEYS` там пуст (проверка по ключу выключена, пока её явно не включат).
- **Cookie** — сервис их не использует (аутентификация — через заголовок `X-API-Key`,
  вложенных сессий нет), поэтому флаги `HttpOnly`/`Secure`/`SameSite` не применяются. Если бы
  в проект добавлялась cookie-based сессия, был бы выбран `SameSite=Strict` (весь UI и API
  обслуживаются одним origin, кросс-сайтовые запросы с cookie не нужны) вместе с `HttpOnly` и
  `Secure`.

## Логирование

- Каждый входящий запрос логируется через `pino-http`: метод, путь, код ответа, длительность,
  `reqId`. Уровень подбирается автоматически: `error` — 5xx, `warn` — 4xx, `info` — успех.
- Идентификатор запроса присваивается в самом начале конвейера (`src/middlewares/requestId.ts`,
  до логирования), возвращается клиенту в заголовке `X-Request-Id` и в `error.requestId` —
  по нему конкретный запрос находится в логах одной фильтрацией.
- Сервисы и репозитории не получают `req` как аргумент, но могут логировать с тем же `reqId`
  через `AsyncLocalStorage` (`src/utils/context.ts`, `getLog()`).
- Уровни логирования: `fatal`/`error`/`warn`/`info`/`debug` (pino, `LOG_LEVEL`). В коде нет
  вызовов `console.log`; вывод в `development` дополнительно проходит через `pino-pretty` для
  читаемости, в `test` логирование отключено (`level: 'silent'`), чтобы не засорять вывод
  тестов.
- В логи не попадают заголовки `Authorization`, `X-API-Key`, `Cookie` (настройка `redact`
  логгера).

## Аутентификация по API-ключу (бонус)

Изменяющие операции (`POST`, `PATCH`, `DELETE`) защищены заголовком `X-API-Key`. Список
действительных ключей задаётся через `API_KEYS` (через запятую). Если переменная пуста —
проверка отключена целиком.

```
POST /api/equipment
X-API-Key: dev-secret-key
```

Без валидного ключа — `401 UNAUTHORIZED` в едином формате ошибок.

## Тестирование

Автотесты API — Jest + Supertest, 24 теста на основные сценарии (CRUD, валидация, переходы
статуса, конфликты, вложенный ресурс, аутентификация, формат ошибок, 404, недоступность
внешнего API).

```bash
npm test
```

Каждый тестовый файл поднимает `createApp()` заново (`tests/helpers/createTestApp.ts`) —
переменные окружения выставляются непосредственно перед динамическим `import('../../src/app.js')`,
поскольку конфигурация валидируется один раз при первом импорте `src/config`. Jest даёт каждому 
тестовому файлу собственный модульный registry, файлы не делят состояние между собой без какого-либо 
файла на диске. Обращение к внешнему погодному API в `tests/weather.test.ts` замокано (`global.fetch`),
поэтому тесты детерминированы и не зависят от сети.

Тесты выполняются в нативном ESM-режиме Jest (`node --experimental-vm-modules`) с транспиляцией 
через `@swc/jest`; тайпчек тестов — отдельным конфигом `tsconfig.test.json` (основной 
`tsconfig.json` собирает только `src/` в `dist/`).

## Postman

Коллекция и окружение лежат в [`docs/postman/`](docs/postman/):

- `equipment-maintenance-api.postman_collection.json`
- `equipment-maintenance-api.postman_environment.json`

Импортируйте оба файла в Postman, выберите окружение **Local**, при
необходимости поправьте `baseUrl`/`apiKey`. Коллекция сгруппирована по ресурсам (`Health`,
`Equipment`, `Requests`, `Negative & security scenarios`), использует `{{baseUrl}}` и
переменные окружения для передачи идентификаторов между запросами (`equipmentId`,
`equipmentId2`, `requestId`, `serialNumber`). В каждом запросе есть `pm.test` минимум на код
ответа и структуру тела. Папка `Negative & security scenarios` отдельно проверяет `400`
(битый JSON), `401` (отсутствующий API-ключ), `404`, `409` (дубль серийного номера и
недопустимый переход статуса — заводит отдельную заявку и переводит её в `rejected`, не
завязываясь на состояние из папки `Requests`), `422` и `429` (rate limit — pre-request script
отправляет пачку запросов перед основным).

Рекомендуемый порядок прогона — «Run collection» сверху вниз, либо папка за папкой
(`Health → Equipment → Requests → Negative & security scenarios`), так как некоторые запросы
опираются на переменные, сохранённые предыдущими.

## Git-флоу

Проект разбит на ветки по функциональным блокам:

- `feat/express-structure` — базовый скелет Express-приложения;
- `feat/config` / `feat/configuration` — чтение и валидация переменных окружения;
- `feat/equipments-crud` — репозиторий/сервис/контроллер/роуты оборудования (включая погодный сервис);
- `feat/requests-crud` — репозиторий/сервис/контроллер/роуты заявок и переходы статуса;
- `feat/validation` — Zod-валидация (оборудование, затем заявки), типы ошибок
  `NotFoundError`/`ConflictError`;
- `feat/security` — helmet, CORS, rate limiting, `X-API-Key` аутентификация, pino-логирование,
  `AsyncLocalStorage`-контекст запроса;
- `feat/docs` — Postman-коллекция и окружение;
- `feat/tests` — Jest + Supertest;
- `feat/docker` — multi-stage Dockerfile и `docker-compose.yaml`.
