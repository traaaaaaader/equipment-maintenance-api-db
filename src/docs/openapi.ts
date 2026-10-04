const errorSchema = {
  type: 'object',
  properties: {
    error: {
      type: 'object',
      required: ['code', 'message', 'requestId'],
      properties: {
        code: {
          type: 'string',
          enum: [
            'VALIDATION_ERROR',
            'BAD_REQUEST',
            'UNAUTHORIZED',
            'FORBIDDEN',
            'NOT_FOUND',
            'CONFLICT',
            'UNPROCESSABLE_ENTITY',
            'SERVICE_UNAVAILABLE',
            'RATE_LIMIT_EXCEEDED',
            'INTERNAL_ERROR',
          ],
        },
        message: { type: 'string' },
        details: {
          type: 'array',
          items: {
            type: 'object',
            properties: { field: { type: 'string' }, message: { type: 'string' } },
          },
        },
        requestId: { type: 'string', format: 'uuid' },
      },
    },
  },
};

const errorResponse = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorSchema } },
});

const paginationMeta = {
  type: 'object',
  properties: { total: { type: 'integer' }, page: { type: 'integer' }, limit: { type: 'integer' } },
};

const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    email: { type: 'string', format: 'email' },
    name: { type: 'string' },
    role: { type: 'string', enum: ['viewer', 'technician', 'admin'] },
    technicianId: { type: 'string', format: 'uuid', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const locationSchema = {
  type: 'object',
  required: ['lat', 'lon'],
  properties: { lat: { type: 'number' }, lon: { type: 'number' } },
};

const passportSchema = {
  type: 'object',
  nullable: true,
  properties: {
    id: { type: 'string', format: 'uuid' },
    manufacturer: { type: 'string' },
    model: { type: 'string' },
    ratedPowerKw: { type: 'number' },
    lastInspectionAt: { type: 'string', format: 'date', nullable: true },
  },
};

const equipmentSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    siteId: { type: 'string', format: 'uuid', nullable: true },
    name: { type: 'string' },
    type: { type: 'string', enum: ['turbine', 'inverter', 'sensor', 'substation'] },
    serialNumber: { type: 'string' },
    location: locationSchema,
    status: { type: 'string', enum: ['operational', 'maintenance', 'fault', 'decommissioned'] },
    installedAt: { type: 'string', format: 'date' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    passport: passportSchema,
  },
};

const assigneeSchema = {
  type: 'object',
  properties: {
    technicianId: { type: 'string', format: 'uuid' },
    fullName: { type: 'string' },
    role: { type: 'string', enum: ['lead', 'member'] },
    plannedHours: { type: 'number' },
  },
};

const sparePartUsageSchema = {
  type: 'object',
  properties: {
    sparePartId: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    sku: { type: 'string' },
    quantityUsed: { type: 'integer' },
  },
};

const requestSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    equipmentId: { type: 'string', format: 'uuid' },
    title: { type: 'string' },
    description: { type: 'string', nullable: true },
    priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
    status: { type: 'string', enum: ['new', 'in_progress', 'done', 'rejected'] },
    plannedAt: { type: 'string', format: 'date-time', nullable: true },
    author: { type: 'string', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    assignees: { type: 'array', items: assigneeSchema },
    spareParts: { type: 'array', items: sparePartUsageSchema },
  },
};

const historyEntrySchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    requestId: { type: 'string', format: 'uuid' },
    previousStatus: { type: 'string', nullable: true },
    newStatus: { type: 'string' },
    changedBy: { type: 'string', nullable: true },
    comment: { type: 'string', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
  },
};

const siteSummarySchema = {
  type: 'object',
  properties: {
    siteId: { type: 'string', format: 'uuid' },
    totalRequests: { type: 'integer' },
    byStatus: { type: 'object' },
    byPriority: { type: 'object' },
    averageCloseTimeHours: { type: 'number', nullable: true },
  },
};

const equipmentLoadRowSchema = {
  type: 'object',
  properties: {
    equipmentId: { type: 'string', format: 'uuid' },
    equipmentName: { type: 'string' },
    serialNumber: { type: 'string' },
    totalRequests: { type: 'integer' },
    closedRequests: { type: 'integer' },
    totalPlannedHours: { type: 'number' },
    lastMaintenanceAt: { type: 'string', format: 'date-time', nullable: true },
  },
};

const idParam = {
  name: 'id',
  in: 'path' as const,
  required: true,
  schema: { type: 'string', format: 'uuid' },
};
const pageParam = { name: 'page', in: 'query' as const, schema: { type: 'integer', default: 1 } };
const limitParam = {
  name: 'limit',
  in: 'query' as const,
  schema: { type: 'integer', default: 20, maximum: 100 },
};

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Equipment Maintenance API',
    version: '4.0.0',
    description:
      'REST API для учёта оборудования, заявок на обслуживание, площадок, специалистов и ' +
      'запчастей. Аутентификация — JWT (access-токен в заголовке Authorization, refresh — ' +
      'в HttpOnly cookie). Роли: viewer (чтение), technician (+ заявки, своя бригада), admin (всё).',
  },
  servers: [{ url: '/' }],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      Error: errorSchema,
      User: userSchema,
      Equipment: equipmentSchema,
      MaintenanceRequest: requestSchema,
    },
  },
  security: [{ bearerAuth: [] }],
  tags: [
    { name: 'Auth', description: 'Регистрация, вход, обновление и завершение сессии' },
    { name: 'Users', description: 'Управление пользователями (admin)' },
    { name: 'Equipment', description: 'Оборудование' },
    { name: 'Requests', description: 'Заявки на обслуживание, бригады, запчасти, история' },
    { name: 'Sites', description: 'Площадки' },
    { name: 'Reports', description: 'Аналитические SQL-отчёты' },
    { name: 'Health', description: 'Проверки работоспособности' },
  ],
  paths: {
    '/api/health/live': {
      get: {
        tags: ['Health'],
        summary: 'Жизнеспособность процесса',
        security: [],
        responses: { '200': { description: 'Процесс жив' } },
      },
    },
    '/api/health/ready': {
      get: {
        tags: ['Health'],
        summary: 'Готовность к обслуживанию (включая БД)',
        security: [],
        responses: { '200': { description: 'Готов' }, '503': errorResponse('БД недоступна') },
      },
    },

    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Регистрация пользователя (роль viewer по умолчанию)',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'name', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  name: { type: 'string', minLength: 2, maxLength: 150 },
                  password: { type: 'string', minLength: 8, maxLength: 72 },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Пользователь создан',
            content: {
              'application/json': { schema: { type: 'object', properties: { data: userSchema } } },
            },
          },
          '409': errorResponse('Email уже занят'),
          '422': errorResponse('Ошибка валидации'),
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Вход: access-токен в теле, refresh — в HttpOnly cookie',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Успешный вход',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: { user: userSchema, accessToken: { type: 'string' } },
                    },
                  },
                },
              },
            },
          },
          '401': errorResponse('Неверные учётные данные (сообщение одинаково для обоих случаев)'),
          '429': errorResponse('Превышен лимит попыток входа'),
        },
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Обновление access-токена по refresh-cookie (с ротацией)',
        security: [],
        responses: {
          '200': { description: 'Новый access-токен выдан, refresh-cookie обновлена' },
          '401': errorResponse('Refresh-токен отсутствует, истёк или уже использован'),
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Завершение сессии: refresh-токен отзывается, cookie удаляется',
        security: [],
        responses: { '204': { description: 'Сессия завершена' } },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Текущий пользователь',
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': { schema: { type: 'object', properties: { data: userSchema } } },
            },
          },
          '401': errorResponse('Не аутентифицирован'),
        },
      },
    },

    '/api/users': {
      get: {
        tags: ['Users'],
        summary: 'Список пользователей (admin)',
        parameters: [
          pageParam,
          limitParam,
          {
            name: 'role',
            in: 'query',
            schema: { type: 'string', enum: ['viewer', 'technician', 'admin'] },
          },
        ],
        responses: {
          '200': { description: 'OK' },
          '401': errorResponse('Не аутентифицирован'),
          '403': errorResponse('Недостаточно прав'),
        },
      },
    },
    '/api/users/{id}/role': {
      patch: {
        tags: ['Users'],
        summary: 'Изменить роль пользователя, при необходимости привязав к специалисту (admin)',
        parameters: [idParam],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['role'],
                properties: {
                  role: { type: 'string', enum: ['viewer', 'technician', 'admin'] },
                  technicianId: {
                    type: 'string',
                    format: 'uuid',
                    description: 'Обязателен при role=technician',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Роль обновлена' },
          '403': errorResponse('Недостаточно прав'),
          '404': errorResponse('Пользователь не найден'),
          '422': errorResponse('technicianId обязателен для роли technician'),
        },
      },
    },

    '/api/equipment': {
      get: {
        tags: ['Equipment'],
        summary: 'Список оборудования',
        parameters: [
          pageParam,
          limitParam,
          { name: 'type', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'sort', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: equipmentSchema },
                    meta: paginationMeta,
                  },
                },
              },
            },
          },
          '401': errorResponse('Не аутентифицирован'),
        },
      },
      post: {
        tags: ['Equipment'],
        summary: 'Создать оборудование (admin)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'type', 'serialNumber', 'location', 'installedAt'],
                properties: {
                  name: { type: 'string' },
                  type: { type: 'string', enum: ['turbine', 'inverter', 'sensor', 'substation'] },
                  serialNumber: { type: 'string' },
                  location: locationSchema,
                  status: {
                    type: 'string',
                    enum: ['operational', 'maintenance', 'fault', 'decommissioned'],
                  },
                  installedAt: { type: 'string', format: 'date' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Создано' },
          '403': errorResponse('Недостаточно прав'),
          '409': errorResponse('Серийный номер уже используется'),
          '422': errorResponse('Ошибка валидации'),
        },
      },
    },
    '/api/equipment/{id}': {
      get: {
        tags: ['Equipment'],
        summary: 'Карточка оборудования',
        parameters: [idParam],
        responses: { '200': { description: 'OK' }, '404': errorResponse('Не найдено') },
      },
      patch: {
        tags: ['Equipment'],
        summary: 'Частичное обновление (admin)',
        parameters: [idParam],
        responses: {
          '200': { description: 'Обновлено' },
          '403': errorResponse('Недостаточно прав'),
          '404': errorResponse('Не найдено'),
          '409': errorResponse('Конфликт серийного номера'),
        },
      },
      delete: {
        tags: ['Equipment'],
        summary: 'Удалить, мягкое удаление (admin; запрещено при открытых заявках)',
        parameters: [idParam],
        responses: {
          '204': { description: 'Удалено' },
          '403': errorResponse('Недостаточно прав'),
          '404': errorResponse('Не найдено'),
          '409': errorResponse('Есть незакрытые заявки'),
        },
      },
    },
    '/api/equipment/{id}/requests': {
      get: {
        tags: ['Equipment'],
        summary: 'Заявки по оборудованию',
        parameters: [idParam, pageParam, limitParam],
        responses: { '200': { description: 'OK' }, '404': errorResponse('Не найдено') },
      },
    },
    '/api/equipment/{id}/weather': {
      get: {
        tags: ['Equipment'],
        summary: 'Прогноз погоды и пригодность окна для наружных работ',
        parameters: [idParam],
        responses: {
          '200': { description: 'OK' },
          '404': errorResponse('Не найдено'),
          '503': errorResponse('Погодный сервис недоступен'),
        },
      },
    },

    '/api/requests': {
      get: {
        tags: ['Requests'],
        summary: 'Список заявок',
        parameters: [
          pageParam,
          limitParam,
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'priority', in: 'query', schema: { type: 'string' } },
          { name: 'equipmentId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'sort', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: requestSchema },
                    meta: paginationMeta,
                  },
                },
              },
            },
          },
          '401': errorResponse('Не аутентифицирован'),
        },
      },
      post: {
        tags: ['Requests'],
        summary: 'Создать заявку (technician, admin)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['equipmentId', 'title', 'priority'],
                properties: {
                  equipmentId: { type: 'string', format: 'uuid' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                  plannedAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Создано' },
          '403': errorResponse('Недостаточно прав'),
          '404': errorResponse('Оборудование не найдено'),
          '422': errorResponse('Ошибка валидации'),
        },
      },
    },
    '/api/requests/{id}': {
      get: {
        tags: ['Requests'],
        summary: 'Карточка заявки',
        parameters: [idParam],
        responses: { '200': { description: 'OK' }, '404': errorResponse('Не найдено') },
      },
      patch: {
        tags: ['Requests'],
        summary: 'Редактировать поля заявки (technician, admin)',
        parameters: [idParam],
        responses: {
          '200': { description: 'Обновлено' },
          '403': errorResponse('Недостаточно прав'),
          '404': errorResponse('Не найдено'),
        },
      },
      delete: {
        tags: ['Requests'],
        summary: 'Удалить заявку (admin)',
        parameters: [idParam],
        responses: {
          '204': { description: 'Удалено' },
          '403': errorResponse('Недостаточно прав'),
          '404': errorResponse('Не найдено'),
        },
      },
    },
    '/api/requests/{id}/status': {
      patch: {
        tags: ['Requests'],
        summary:
          'Сменить статус (technician — только если состоит в бригаде заявки; admin — у любой)',
        parameters: [idParam],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['new', 'in_progress', 'done', 'rejected'] },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Статус обновлён' },
          '403': errorResponse('Недостаточно прав, либо вы не в бригаде этой заявки'),
          '404': errorResponse('Не найдено'),
          '409': errorResponse(
            'Недопустимый переход статуса, либо нет назначенной бригады для перехода в in_progress',
          ),
        },
      },
    },
    '/api/requests/{id}/assignees': {
      post: {
        tags: ['Requests'],
        summary: 'Назначить бригаду (admin). Одной транзакцией: ровно один lead, без дублей',
        parameters: [idParam],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['assignees'],
                properties: {
                  assignees: {
                    type: 'array',
                    minItems: 1,
                    items: {
                      type: 'object',
                      required: ['technicianId', 'role', 'plannedHours'],
                      properties: {
                        technicianId: { type: 'string', format: 'uuid' },
                        role: { type: 'string', enum: ['lead', 'member'] },
                        plannedHours: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Бригада назначена',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { data: { type: 'array', items: assigneeSchema } },
                },
              },
            },
          },
          '403': errorResponse('Недостаточно прав'),
          '404': errorResponse(
            'Заявка или специалист(ы) не найдены — транзакция полностью откатывается',
          ),
          '409': errorResponse('Специалист указан дважды'),
          '422': errorResponse('В бригаде должен быть ровно один lead'),
        },
      },
    },
    '/api/requests/{id}/assignees/{userId}': {
      delete: {
        tags: ['Requests'],
        summary: 'Снять специалиста с заявки (admin)',
        parameters: [
          idParam,
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'technicianId',
          },
        ],
        responses: {
          '204': { description: 'Снят' },
          '403': errorResponse('Недостаточно прав'),
          '404': errorResponse('Заявка не найдена, либо специалист не назначен'),
        },
      },
    },
    '/api/requests/{id}/history': {
      get: {
        tags: ['Requests'],
        summary: 'Журнал изменений статуса заявки (хронологически)',
        parameters: [idParam, pageParam, limitParam],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: historyEntrySchema },
                    meta: paginationMeta,
                  },
                },
              },
            },
          },
          '404': errorResponse('Не найдено'),
        },
      },
    },
    '/api/requests/{id}/spare-parts': {
      post: {
        tags: ['Requests'],
        summary: 'Списать запчасть по заявке — атомарно (technician, admin)',
        parameters: [idParam],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['sparePartId', 'quantityUsed'],
                properties: {
                  sparePartId: { type: 'string', format: 'uuid' },
                  quantityUsed: { type: 'integer', minimum: 1 },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Списано, карточка заявки обновлена' },
          '403': errorResponse('Недостаточно прав'),
          '404': errorResponse('Заявка или запчасть не найдены'),
          '409': errorResponse('Недостаточно запчасти на складе'),
        },
      },
    },

    '/api/sites/{id}/summary': {
      get: {
        tags: ['Sites'],
        summary: 'Сводка по площадке: заявки по статусам/приоритетам, среднее время закрытия',
        parameters: [idParam],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { data: siteSummarySchema } },
              },
            },
          },
          '404': errorResponse('Площадка не найдена'),
        },
      },
    },

    '/api/reports/equipment-load': {
      get: {
        tags: ['Reports'],
        summary: 'Аналитический отчёт по нагрузке на оборудование (raw SQL, JOIN + агрегаты)',
        parameters: [
          { name: 'dateFrom', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'dateTo', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'minRequests', in: 'query', schema: { type: 'integer', minimum: 0 } },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { data: { type: 'array', items: equipmentLoadRowSchema } },
                },
              },
            },
          },
          '422': errorResponse('Ошибка валидации параметров'),
        },
      },
    },
  },
};
