'use strict';

const EQUIPMENT_TYPES = ['turbine', 'inverter', 'sensor', 'substation'];
const EQUIPMENT_STATUSES = ['operational', 'maintenance', 'fault', 'decommissioned'];
const REQUEST_PRIORITIES = ['low', 'medium', 'high', 'critical'];
const REQUEST_STATUSES = ['new', 'in_progress', 'done', 'rejected'];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('equipment', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      name: { type: Sequelize.STRING(100), allowNull: false },
      type: { type: Sequelize.ENUM(...EQUIPMENT_TYPES), allowNull: false },
      serial_number: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      location_lat: { type: Sequelize.DECIMAL(9, 6), allowNull: false },
      location_lon: { type: Sequelize.DECIMAL(9, 6), allowNull: false },
      status: {
        type: Sequelize.ENUM(...EQUIPMENT_STATUSES),
        allowNull: false,
        defaultValue: 'operational',
      },
      installed_at: { type: Sequelize.DATEONLY, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('equipment', ['status']);
    await queryInterface.addIndex('equipment', ['type']);

    await queryInterface.createTable('maintenance_requests', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      equipment_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'equipment', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      title: { type: Sequelize.STRING(120), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      priority: { type: Sequelize.ENUM(...REQUEST_PRIORITIES), allowNull: false },
      status: {
        type: Sequelize.ENUM(...REQUEST_STATUSES),
        allowNull: false,
        defaultValue: 'new',
      },
      planned_at: { type: Sequelize.DATE, allowNull: true },
      author: { type: Sequelize.STRING(150), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });
    await queryInterface.addIndex('maintenance_requests', ['equipment_id']);
    await queryInterface.addIndex('maintenance_requests', ['status']);
    await queryInterface.addIndex('maintenance_requests', ['priority']);
    await queryInterface.addIndex('maintenance_requests', ['created_at']);

    await queryInterface.createTable('equipment_passports', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      equipment_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'equipment', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      manufacturer: { type: Sequelize.STRING(150), allowNull: false },
      model: { type: Sequelize.STRING(150), allowNull: false },
      rated_power_kw: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      last_inspection_at: { type: Sequelize.DATEONLY, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('equipment_passports');
    await queryInterface.dropTable('maintenance_requests');
    await queryInterface.dropTable('equipment');
  },
};
