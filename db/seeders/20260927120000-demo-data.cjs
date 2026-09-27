'use strict';

const { randomUUID } = require('node:crypto');

const DAY_MS = 24 * 60 * 60 * 1000;
const now = new Date();
const daysAgo = (n) => new Date(now.getTime() - n * DAY_MS);

const id = (group, n) => `${group}-${String(n).padStart(12, '0')}`;
const site = (n) => id('11111111-1111-4111-8111', n);
const equipment = (n) => id('22222222-2222-4222-8222', n);
const tech = (n) => id('44444444-4444-4444-8444', n);
const part = (n) => id('66666666-6666-4666-8666', n);
const request = (n) => id('55555555-5555-4555-8555', n);

const SITE = { vostok: site(1), sever: site(2), zarya: site(3) };

const EQ = {
  wtg001: equipment(1),
  wtg002: equipment(2),
  inv001: equipment(3),
  sen001: equipment(4),
  wtg101: equipment(5),
  wtg102: equipment(6),
  sub001: equipment(7),
  inv101: equipment(8),
};

const TECH = {
  ivanov: tech(1),
  smirnova: tech(2),
  kuznetsov: tech(3),
  sokolov: tech(4),
  morozova: tech(5),
  volkov: tech(6),
};

const PART = {
  bearing: part(1),
  oilFilter: part(2),
  tempSensor: part(3),
  bladeSeal: part(4),
  airFilter: part(5),
  insulator: part(6),
};

const sitesRows = [
  {
    id: SITE.vostok,
    name: 'Ветропарк Восход',
    code: 'SITE-01',
    region: 'Краснодарский край',
    location_lat: 45.0448,
    location_lon: 38.976,
    created_at: now,
    updated_at: now,
  },
  {
    id: SITE.sever,
    name: 'Ветропарк Северный',
    code: 'SITE-02',
    region: 'Мурманская область',
    location_lat: 68.9585,
    location_lon: 33.0827,
    created_at: now,
    updated_at: now,
  },
  {
    id: SITE.zarya,
    name: 'Подстанция Заря',
    code: 'SITE-03',
    region: 'Ростовская область',
    location_lat: 47.2357,
    location_lon: 39.7015,
    created_at: now,
    updated_at: now,
  },
];

const equipmentRows = [
  {
    id: EQ.wtg001,
    site_id: SITE.vostok,
    name: 'Турбина WTG-001',
    type: 'turbine',
    serial_number: 'SN-WTG-001',
    location_lat: 45.046,
    location_lon: 38.977,
    status: 'operational',
    installed_at: '2019-05-10',
    created_at: now,
    updated_at: now,
    deleted_at: null,
  },
  {
    id: EQ.wtg002,
    site_id: SITE.vostok,
    name: 'Турбина WTG-002',
    type: 'turbine',
    serial_number: 'SN-WTG-002',
    location_lat: 45.0465,
    location_lon: 38.9775,
    status: 'maintenance',
    installed_at: '2019-05-12',
    created_at: now,
    updated_at: now,
    deleted_at: null,
  },
  {
    id: EQ.inv001,
    site_id: SITE.vostok,
    name: 'Инвертор INV-001',
    type: 'inverter',
    serial_number: 'SN-INV-001',
    location_lat: 45.045,
    location_lon: 38.9762,
    status: 'operational',
    installed_at: '2020-03-01',
    created_at: now,
    updated_at: now,
    deleted_at: null,
  },
  {
    id: EQ.sen001,
    site_id: SITE.sever,
    name: 'Метеодатчик SEN-001',
    type: 'sensor',
    serial_number: 'SN-SEN-001',
    location_lat: 68.959,
    location_lon: 33.083,
    status: 'operational',
    installed_at: '2021-07-15',
    created_at: now,
    updated_at: now,
    deleted_at: null,
  },
  {
    id: EQ.wtg101,
    site_id: SITE.sever,
    name: 'Турбина WTG-101',
    type: 'turbine',
    serial_number: 'SN-WTG-101',
    location_lat: 68.96,
    location_lon: 33.085,
    status: 'fault',
    installed_at: '2018-11-20',
    created_at: now,
    updated_at: now,
    deleted_at: null,
  },
  {
    id: EQ.wtg102,
    site_id: SITE.sever,
    name: 'Турбина WTG-102',
    type: 'turbine',
    serial_number: 'SN-WTG-102',
    location_lat: 68.961,
    location_lon: 33.086,
    status: 'operational',
    installed_at: '2018-11-22',
    created_at: now,
    updated_at: now,
    deleted_at: null,
  },
  {
    id: EQ.sub001,
    site_id: SITE.zarya,
    name: 'Подстанция SUB-001',
    type: 'substation',
    serial_number: 'SN-SUB-001',
    location_lat: 47.236,
    location_lon: 39.702,
    status: 'operational',
    installed_at: '2017-01-30',
    created_at: now,
    updated_at: now,
    deleted_at: null,
  },
  {
    id: EQ.inv101,
    site_id: SITE.zarya,
    name: 'Инвертор INV-101',
    type: 'inverter',
    serial_number: 'SN-INV-101',
    location_lat: 47.2365,
    location_lon: 39.7025,
    status: 'decommissioned',
    installed_at: '2015-06-01',
    created_at: now,
    updated_at: now,
    deleted_at: null,
  },
];

const passportRows = [
  {
    id: randomUUID(),
    equipment_id: EQ.wtg001,
    manufacturer: 'Vestas',
    model: 'V150-4.2MW',
    rated_power_kw: 4200.0,
    last_inspection_at: '2025-01-15',
    created_at: now,
    updated_at: now,
  },
  {
    id: randomUUID(),
    equipment_id: EQ.wtg002,
    manufacturer: 'Vestas',
    model: 'V150-4.2MW',
    rated_power_kw: 4200.0,
    last_inspection_at: '2024-11-01',
    created_at: now,
    updated_at: now,
  },
  {
    id: randomUUID(),
    equipment_id: EQ.inv001,
    manufacturer: 'SMA',
    model: 'Sunny Central 2200',
    rated_power_kw: 2200.0,
    last_inspection_at: '2025-03-10',
    created_at: now,
    updated_at: now,
  },
  {
    id: randomUUID(),
    equipment_id: EQ.wtg101,
    manufacturer: 'Siemens Gamesa',
    model: 'SG 5.8-170',
    rated_power_kw: 5800.0,
    last_inspection_at: '2023-08-20',
    created_at: now,
    updated_at: now,
  },
  {
    id: randomUUID(),
    equipment_id: EQ.sub001,
    manufacturer: 'ABB',
    model: 'PowerStation 110kV',
    rated_power_kw: 50000.0,
    last_inspection_at: '2025-02-01',
    created_at: now,
    updated_at: now,
  },
];

const technicianRows = [
  {
    id: TECH.ivanov,
    full_name: 'Иванов Пётр Сергеевич',
    specialization: 'Электрик',
    badge_number: 'TECH-001',
    created_at: now,
    updated_at: now,
  },
  {
    id: TECH.smirnova,
    full_name: 'Смирнова Анна Викторовна',
    specialization: 'Механик',
    badge_number: 'TECH-002',
    created_at: now,
    updated_at: now,
  },
  {
    id: TECH.kuznetsov,
    full_name: 'Кузнецов Дмитрий Олегович',
    specialization: 'Диагностика',
    badge_number: 'TECH-003',
    created_at: now,
    updated_at: now,
  },
  {
    id: TECH.sokolov,
    full_name: 'Соколов Игорь Николаевич',
    specialization: 'Электрик',
    badge_number: 'TECH-004',
    created_at: now,
    updated_at: now,
  },
  {
    id: TECH.morozova,
    full_name: 'Морозова Елена Андреевна',
    specialization: 'Механик',
    badge_number: 'TECH-005',
    created_at: now,
    updated_at: now,
  },
  {
    id: TECH.volkov,
    full_name: 'Волков Артём Русланович',
    specialization: 'Диагностика',
    badge_number: 'TECH-006',
    created_at: now,
    updated_at: now,
  },
];

const sparePartRows = [
  {
    id: PART.bearing,
    name: 'Подшипник главного вала',
    sku: 'PRT-BRG-001',
    quantity: 12,
    created_at: now,
    updated_at: now,
  },
  {
    id: PART.oilFilter,
    name: 'Масляный фильтр редуктора',
    sku: 'PRT-OIL-002',
    quantity: 30,
    created_at: now,
    updated_at: now,
  },
  {
    id: PART.tempSensor,
    name: 'Датчик температуры',
    sku: 'PRT-TMP-003',
    quantity: 20,
    created_at: now,
    updated_at: now,
  },
  {
    id: PART.bladeSeal,
    name: 'Уплотнение лопасти',
    sku: 'PRT-SEAL-004',
    quantity: 8,
    created_at: now,
    updated_at: now,
  },
  {
    id: PART.airFilter,
    name: 'Воздушный фильтр гондолы',
    sku: 'PRT-AIR-005',
    quantity: 25,
    created_at: now,
    updated_at: now,
  },
  {
    id: PART.insulator,
    name: 'Изолятор высоковольтный',
    sku: 'PRT-INS-006',
    quantity: 15,
    created_at: now,
    updated_at: now,
  },
];

const requestSpecs = [
  {
    eq: EQ.wtg001,
    title: 'Плановое ТО генератора',
    description: 'Ежегодное плановое обслуживание генератора турбины.',
    priority: 'medium',
    createdDaysAgo: 60,
    author: 'Оператор Петров',
    transitions: [
      {
        to: 'in_progress',
        afterDays: 1,
        changedBy: 'Иванов Пётр Сергеевич',
        comment: 'Бригада выехала на объект',
      },
      {
        to: 'done',
        afterDays: 5,
        changedBy: 'Иванов Пётр Сергеевич',
        comment: 'Работы завершены, генератор в норме',
      },
    ],
    assignees: [
      { tech: TECH.ivanov, role: 'lead', hours: 8 },
      { tech: TECH.smirnova, role: 'member', hours: 6 },
    ],
    parts: [{ part: PART.bearing, qty: 2 }],
  },
  {
    eq: EQ.wtg001,
    title: 'Замена подшипника редуктора',
    description: 'Повышенная вибрация редуктора, требуется замена подшипника.',
    priority: 'high',
    createdDaysAgo: 40,
    author: 'Оператор Петров',
    transitions: [
      {
        to: 'in_progress',
        afterDays: 1,
        changedBy: 'Смирнова Анна Викторовна',
        comment: 'Диагностика подтвердила износ',
      },
      {
        to: 'done',
        afterDays: 7,
        changedBy: 'Смирнова Анна Викторовна',
        comment: 'Подшипник заменён',
      },
    ],
    assignees: [{ tech: TECH.smirnova, role: 'lead', hours: 10 }],
    parts: [{ part: PART.bearing, qty: 1 }],
  },
  {
    eq: EQ.wtg001,
    title: 'Шум в гондоле',
    description: 'Жалоба на посторонний шум при работе турбины.',
    priority: 'low',
    createdDaysAgo: 3,
    author: 'Оператор Петров',
    plannedAfterDays: 5,
    transitions: [],
    assignees: [],
    parts: [],
  },
  {
    eq: EQ.wtg002,
    title: 'Вибрация лопасти',
    description: 'Датчики зафиксировали повышенную вибрацию одной из лопастей.',
    priority: 'high',
    createdDaysAgo: 5,
    author: 'Оператор Сидоров',
    transitions: [
      {
        to: 'in_progress',
        afterDays: 1,
        changedBy: 'Иванов Пётр Сергеевич',
        comment: 'Бригада направлена на осмотр',
      },
    ],
    assignees: [
      { tech: TECH.ivanov, role: 'lead', hours: 12 },
      { tech: TECH.kuznetsov, role: 'member', hours: 8 },
    ],
    parts: [],
  },
  {
    eq: EQ.wtg002,
    title: 'Течь масла в редукторе',
    description: 'Обнаружена течь масла при плановом обходе.',
    priority: 'critical',
    createdDaysAgo: 2,
    author: 'Оператор Сидоров',
    transitions: [
      {
        to: 'in_progress',
        afterDays: 0.25,
        changedBy: 'Кузнецов Дмитрий Олегович',
        comment: 'Аварийный выезд',
      },
    ],
    assignees: [{ tech: TECH.kuznetsov, role: 'lead', hours: 6 }],
    parts: [],
  },
  {
    eq: EQ.wtg002,
    title: 'Проверка датчика температуры',
    description: 'Подозрение на некорректные показания датчика.',
    priority: 'medium',
    createdDaysAgo: 15,
    author: 'Оператор Сидоров',
    transitions: [
      {
        to: 'rejected',
        afterDays: 2,
        changedBy: 'Диспетчер Новикова',
        comment: 'Дубликат заявки, закрыто без выезда',
      },
    ],
    assignees: [],
    parts: [],
  },
  {
    eq: EQ.inv001,
    title: 'Диагностика инвертора',
    description: 'Плановая диагностика силового модуля инвертора.',
    priority: 'medium',
    createdDaysAgo: 30,
    author: 'Оператор Петров',
    transitions: [
      {
        to: 'in_progress',
        afterDays: 1,
        changedBy: 'Соколов Игорь Николаевич',
        comment: 'Начата диагностика',
      },
      {
        to: 'done',
        afterDays: 4,
        changedBy: 'Соколов Игорь Николаевич',
        comment: 'Неисправностей не выявлено',
      },
    ],
    assignees: [{ tech: TECH.sokolov, role: 'lead', hours: 5 }],
    parts: [{ part: PART.tempSensor, qty: 1 }],
  },
  {
    eq: EQ.inv001,
    title: 'Перегрев силового модуля',
    description: 'Срабатывание защиты по превышению температуры.',
    priority: 'high',
    createdDaysAgo: 4,
    author: 'Оператор Петров',
    transitions: [
      {
        to: 'in_progress',
        afterDays: 1,
        changedBy: 'Соколов Игорь Николаевич',
        comment: 'Выезд бригады',
      },
    ],
    assignees: [
      { tech: TECH.sokolov, role: 'lead', hours: 8 },
      { tech: TECH.morozova, role: 'member', hours: 4 },
    ],
    parts: [],
  },
  {
    eq: EQ.inv001,
    title: 'Обновление прошивки контроллера',
    description: 'Плановое обновление ПО контроллера инвертора.',
    priority: 'low',
    createdDaysAgo: 1,
    author: 'Оператор Петров',
    plannedAfterDays: 4,
    transitions: [],
    assignees: [],
    parts: [],
  },
  {
    eq: EQ.sen001,
    title: 'Калибровка датчика ветра',
    description: 'Плановая калибровка анемометра.',
    priority: 'low',
    createdDaysAgo: 20,
    author: 'Оператор Кузьмина',
    transitions: [
      {
        to: 'in_progress',
        afterDays: 1,
        changedBy: 'Морозова Елена Андреевна',
        comment: 'Калибровка начата',
      },
      {
        to: 'done',
        afterDays: 2,
        changedBy: 'Морозова Елена Андреевна',
        comment: 'Калибровка завершена',
      },
    ],
    assignees: [{ tech: TECH.morozova, role: 'lead', hours: 3 }],
    parts: [],
  },
  {
    eq: EQ.sen001,
    title: 'Замена батареи датчика',
    description: 'Низкий заряд автономного питания датчика.',
    priority: 'medium',
    createdDaysAgo: 6,
    author: 'Оператор Кузьмина',
    plannedAfterDays: 2,
    transitions: [],
    assignees: [],
    parts: [],
  },
  {
    eq: EQ.sen001,
    title: 'Ложные показания скорости ветра',
    description: 'Жалоба диспетчера на аномальные значения.',
    priority: 'low',
    createdDaysAgo: 10,
    author: 'Оператор Кузьмина',
    transitions: [
      {
        to: 'rejected',
        afterDays: 1,
        changedBy: 'Диспетчер Новикова',
        comment: 'Не подтвердилось при выезде',
      },
    ],
    assignees: [],
    parts: [],
  },
  {
    eq: EQ.wtg101,
    title: 'Аварийная остановка турбины',
    description: 'Автоматическая остановка по превышению вибрации.',
    priority: 'critical',
    createdDaysAgo: 50,
    author: 'Диспетчерская служба',
    transitions: [
      {
        to: 'in_progress',
        afterDays: 0.5,
        changedBy: 'Смирнова Анна Викторовна',
        comment: 'Аварийный выезд бригады',
      },
      {
        to: 'done',
        afterDays: 3,
        changedBy: 'Смирнова Анна Викторовна',
        comment: 'Турбина возвращена в работу',
      },
    ],
    assignees: [
      { tech: TECH.smirnova, role: 'lead', hours: 15 },
      { tech: TECH.volkov, role: 'member', hours: 10 },
    ],
    parts: [
      { part: PART.bladeSeal, qty: 1 },
      { part: PART.bearing, qty: 1 },
    ],
  },
  {
    eq: EQ.wtg101,
    title: 'Замена лопасти',
    description: 'Обнаружена трещина в уплотнении лопасти при осмотре.',
    priority: 'critical',
    createdDaysAgo: 7,
    author: 'Диспетчерская служба',
    transitions: [
      {
        to: 'in_progress',
        afterDays: 1,
        changedBy: 'Волков Артём Русланович',
        comment: 'Начата замена',
      },
    ],
    assignees: [
      { tech: TECH.volkov, role: 'lead', hours: 20 },
      { tech: TECH.smirnova, role: 'member', hours: 15 },
    ],
    parts: [{ part: PART.bladeSeal, qty: 1 }],
  },
  {
    eq: EQ.wtg101,
    title: 'Плановая инспекция',
    description: 'Ежеквартальная плановая инспекция турбины.',
    priority: 'medium',
    createdDaysAgo: 90,
    author: 'Оператор Сидоров',
    transitions: [
      {
        to: 'in_progress',
        afterDays: 2,
        changedBy: 'Иванов Пётр Сергеевич',
        comment: 'Инспекция начата',
      },
      {
        to: 'done',
        afterDays: 6,
        changedBy: 'Иванов Пётр Сергеевич',
        comment: 'Замечаний не выявлено',
      },
    ],
    assignees: [{ tech: TECH.ivanov, role: 'lead', hours: 8 }],
    parts: [],
  },
  {
    eq: EQ.wtg102,
    title: 'Скрип в гондоле',
    description: 'Жалоба на посторонний звук при работе.',
    priority: 'low',
    createdDaysAgo: 2,
    author: 'Оператор Сидоров',
    plannedAfterDays: 6,
    transitions: [],
    assignees: [],
    parts: [],
  },
  {
    eq: EQ.wtg102,
    title: 'Замена воздушного фильтра',
    description: 'Плановая замена воздушного фильтра гондолы.',
    priority: 'medium',
    createdDaysAgo: 25,
    author: 'Оператор Сидоров',
    transitions: [
      {
        to: 'in_progress',
        afterDays: 1,
        changedBy: 'Кузнецов Дмитрий Олегович',
        comment: 'Начата замена фильтра',
      },
      {
        to: 'done',
        afterDays: 3,
        changedBy: 'Кузнецов Дмитрий Олегович',
        comment: 'Фильтр заменён',
      },
    ],
    assignees: [{ tech: TECH.kuznetsov, role: 'lead', hours: 4 }],
    parts: [{ part: PART.airFilter, qty: 2 }],
  },
  {
    eq: EQ.wtg102,
    title: 'Отказ датчика вибрации',
    description: 'Датчик вибрации перестал передавать данные.',
    priority: 'high',
    createdDaysAgo: 3,
    author: 'Оператор Сидоров',
    transitions: [
      {
        to: 'in_progress',
        afterDays: 1,
        changedBy: 'Морозова Елена Андреевна',
        comment: 'Диагностика датчика',
      },
    ],
    assignees: [{ tech: TECH.morozova, role: 'lead', hours: 6 }],
    parts: [],
  },
  {
    eq: EQ.sub001,
    title: 'Плановое обслуживание трансформатора',
    description: 'Ежегодное плановое обслуживание силового трансформатора.',
    priority: 'high',
    createdDaysAgo: 45,
    author: 'Оператор Кузьмина',
    transitions: [
      {
        to: 'in_progress',
        afterDays: 1,
        changedBy: 'Соколов Игорь Николаевич',
        comment: 'Начаты работы',
      },
      {
        to: 'done',
        afterDays: 8,
        changedBy: 'Соколов Игорь Николаевич',
        comment: 'Обслуживание завершено',
      },
    ],
    assignees: [
      { tech: TECH.sokolov, role: 'lead', hours: 20 },
      { tech: TECH.ivanov, role: 'member', hours: 12 },
    ],
    parts: [{ part: PART.insulator, qty: 3 }],
  },
  {
    eq: EQ.sub001,
    title: 'Проверка изоляции',
    description: 'Внеплановая проверка сопротивления изоляции.',
    priority: 'medium',
    createdDaysAgo: 6,
    author: 'Оператор Кузьмина',
    transitions: [
      {
        to: 'in_progress',
        afterDays: 2,
        changedBy: 'Соколов Игорь Николаевич',
        comment: 'Проверка начата',
      },
    ],
    assignees: [{ tech: TECH.sokolov, role: 'lead', hours: 10 }],
    parts: [],
  },
  {
    eq: EQ.sub001,
    title: 'Срабатывание защиты',
    description: 'Кратковременное срабатывание релейной защиты.',
    priority: 'critical',
    createdDaysAgo: 12,
    author: 'Диспетчерская служба',
    transitions: [
      {
        to: 'in_progress',
        afterDays: 1,
        changedBy: 'Волков Артём Русланович',
        comment: 'Выезд для диагностики',
      },
      {
        to: 'rejected',
        afterDays: 2,
        changedBy: 'Волков Артём Русланович',
        comment: 'Ложное срабатывание, устранено дистанционно',
      },
    ],
    assignees: [{ tech: TECH.volkov, role: 'lead', hours: 4 }],
    parts: [],
  },
  {
    eq: EQ.inv101,
    title: 'Диагностика перед списанием',
    description: 'Итоговая диагностика перед выводом из эксплуатации.',
    priority: 'low',
    createdDaysAgo: 100,
    author: 'Оператор Кузьмина',
    transitions: [
      {
        to: 'in_progress',
        afterDays: 2,
        changedBy: 'Смирнова Анна Викторовна',
        comment: 'Диагностика начата',
      },
      {
        to: 'done',
        afterDays: 10,
        changedBy: 'Смирнова Анна Викторовна',
        comment: 'Акт диагностики оформлен',
      },
    ],
    assignees: [{ tech: TECH.smirnova, role: 'lead', hours: 6 }],
    parts: [],
  },
  {
    eq: EQ.inv101,
    title: 'Проверка кабельных вводов',
    description: 'Проверка состояния кабельных вводов перед демонтажем.',
    priority: 'low',
    createdDaysAgo: 4,
    author: 'Оператор Кузьмина',
    plannedAfterDays: 3,
    transitions: [],
    assignees: [],
    parts: [],
  },
  {
    eq: EQ.inv101,
    title: 'Утилизация компонентов',
    description: 'Организация утилизации демонтированных компонентов.',
    priority: 'medium',
    createdDaysAgo: 1,
    author: 'Оператор Кузьмина',
    plannedAfterDays: 10,
    transitions: [],
    assignees: [],
    parts: [],
  },
];

const requestRows = [];
const historyRows = [];
const assigneeRows = [];
const partUsageRows = [];

requestSpecs.forEach((spec, idx) => {
  const reqId = request(idx + 1);
  const createdAt = daysAgo(spec.createdDaysAgo);
  let currentStatus = 'new';
  let updatedAt = createdAt;
  let inProgressAt = null;

  for (const t of spec.transitions) {
    const changedAt = daysAgo(spec.createdDaysAgo - t.afterDays);
    historyRows.push({
      id: randomUUID(),
      request_id: reqId,
      previous_status: currentStatus,
      new_status: t.to,
      changed_by: t.changedBy,
      comment: t.comment ?? null,
      created_at: changedAt,
    });
    if (t.to === 'in_progress' && !inProgressAt) inProgressAt = changedAt;
    currentStatus = t.to;
    updatedAt = changedAt;
  }

  requestRows.push({
    id: reqId,
    equipment_id: spec.eq,
    title: spec.title,
    description: spec.description ?? null,
    priority: spec.priority,
    status: currentStatus,
    planned_at:
      spec.plannedAfterDays != null ? daysAgo(spec.createdDaysAgo - spec.plannedAfterDays) : null,
    author: spec.author ?? null,
    created_at: createdAt,
    updated_at: updatedAt,
  });

  const assignedAt = inProgressAt ?? createdAt;
  for (const a of spec.assignees) {
    assigneeRows.push({
      id: randomUUID(),
      request_id: reqId,
      technician_id: a.tech,
      role: a.role,
      planned_hours: a.hours,
      created_at: assignedAt,
      updated_at: updatedAt,
    });
  }

  for (const p of spec.parts) {
    partUsageRows.push({
      id: randomUUID(),
      request_id: reqId,
      spare_part_id: p.part,
      quantity_used: p.qty,
      created_at: updatedAt,
      updated_at: updatedAt,
    });
  }
});

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('sites', sitesRows);
    await queryInterface.bulkInsert('equipment', equipmentRows);
    await queryInterface.bulkInsert('equipment_passports', passportRows);
    await queryInterface.bulkInsert('technicians', technicianRows);
    await queryInterface.bulkInsert('spare_parts', sparePartRows);
    await queryInterface.bulkInsert('maintenance_requests', requestRows);
    await queryInterface.bulkInsert('request_status_history', historyRows);
    await queryInterface.bulkInsert('request_assignees', assigneeRows);
    await queryInterface.bulkInsert('request_spare_parts', partUsageRows);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('request_spare_parts', null, {});
    await queryInterface.bulkDelete('request_assignees', null, {});
    await queryInterface.bulkDelete('request_status_history', null, {});
    await queryInterface.bulkDelete('maintenance_requests', null, {});
    await queryInterface.bulkDelete('spare_parts', null, {});
    await queryInterface.bulkDelete('technicians', null, {});
    await queryInterface.bulkDelete('equipment_passports', null, {});
    await queryInterface.bulkDelete('equipment', null, {});
    await queryInterface.bulkDelete('sites', null, {});
  },
};
