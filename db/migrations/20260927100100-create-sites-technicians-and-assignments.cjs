'use strict';

const REQUEST_STATUSES = ['new', 'in_progress', 'done', 'rejected'];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('sites', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      name: { type: Sequelize.STRING(150), allowNull: false },
      code: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      region: { type: Sequelize.STRING(150), allowNull: false },
      location_lat: { type: Sequelize.DECIMAL(9, 6), allowNull: false },
      location_lon: { type: Sequelize.DECIMAL(9, 6), allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });

    await queryInterface.addColumn('equipment', 'site_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'sites', key: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addIndex('equipment', ['site_id']);

    await queryInterface.createTable('technicians', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      full_name: { type: Sequelize.STRING(150), allowNull: false },
      specialization: { type: Sequelize.STRING(150), allowNull: false },
      badge_number: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });

    await queryInterface.createTable('request_status_history', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      request_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'maintenance_requests', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      previous_status: { type: Sequelize.ENUM(...REQUEST_STATUSES), allowNull: true },
      new_status: { type: Sequelize.ENUM(...REQUEST_STATUSES), allowNull: false },
      changed_by: { type: Sequelize.STRING(150), allowNull: true },
      comment: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });
    await queryInterface.addIndex('request_status_history', ['request_id']);

    await queryInterface.createTable('request_assignees', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      request_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'maintenance_requests', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      technician_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'technicians', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      role: { type: Sequelize.ENUM('lead', 'member'), allowNull: false },
      planned_hours: { type: Sequelize.DECIMAL(6, 2), allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });
    await queryInterface.addConstraint('request_assignees', {
      fields: ['request_id', 'technician_id'],
      type: 'unique',
      name: 'request_assignees_request_id_technician_id_uk',
    });
    await queryInterface.addIndex('request_assignees', ['technician_id']);
    await queryInterface.addConstraint('request_assignees', {
      fields: ['planned_hours'],
      type: 'check',
      where: { planned_hours: { [Sequelize.Op.gt]: 0 } },
      name: 'request_assignees_planned_hours_positive_ck',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('request_assignees');
    await queryInterface.dropTable('request_status_history');
    await queryInterface.dropTable('technicians');
    await queryInterface.removeColumn('equipment', 'site_id');
    await queryInterface.dropTable('sites');
  },
};
