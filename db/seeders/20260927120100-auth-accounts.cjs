'use strict';

const bcrypt = require('bcryptjs');

const id = (group, n) => `${group}-${String(n).padStart(12, '0')}`;
const tech = (n) => id('44444444-4444-4444-8444', n);
const user = (n) => id('77777777-7777-4777-8777', n);

const now = new Date();
const PASSWORD_HASH = bcrypt.hashSync('ChangeMe123!', 10);

const USERS = {
  admin: user(1),
  technicianIvanov: user(2),
  technicianSmirnova: user(3),
  viewer: user(4),
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('users', [
      {
        id: USERS.admin,
        email: 'admin@example.com',
        password_hash: PASSWORD_HASH,
        name: 'Главный администратор',
        role: 'admin',
        technician_id: null,
        created_at: now,
        updated_at: now,
      },
      {
        id: USERS.technicianIvanov,
        email: 'ivanov@example.com',
        password_hash: PASSWORD_HASH,
        name: 'Иванов Пётр Сергеевич',
        role: 'technician',
        technician_id: tech(1),
        created_at: now,
        updated_at: now,
      },
      {
        id: USERS.technicianSmirnova,
        email: 'smirnova@example.com',
        password_hash: PASSWORD_HASH,
        name: 'Смирнова Анна Викторовна',
        role: 'technician',
        technician_id: tech(2),
        created_at: now,
        updated_at: now,
      },
      {
        id: USERS.viewer,
        email: 'viewer@example.com',
        password_hash: PASSWORD_HASH,
        name: 'Виктор Наблюдатель',
        role: 'viewer',
        technician_id: null,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', null, {});
  },
};
