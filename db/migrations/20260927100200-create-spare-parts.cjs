'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('spare_parts', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      name: { type: Sequelize.STRING(150), allowNull: false },
      sku: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });
    await queryInterface.addConstraint('spare_parts', {
      fields: ['quantity'],
      type: 'check',
      where: { quantity: { [Sequelize.Op.gte]: 0 } },
      name: 'spare_parts_quantity_non_negative_ck',
    });

    await queryInterface.createTable('request_spare_parts', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      request_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'maintenance_requests', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      spare_part_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'spare_parts', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      quantity_used: { type: Sequelize.INTEGER, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });
    await queryInterface.addConstraint('request_spare_parts', {
      fields: ['request_id', 'spare_part_id'],
      type: 'unique',
      name: 'request_spare_parts_request_id_spare_part_id_uk',
    });
    await queryInterface.addIndex('request_spare_parts', ['spare_part_id']);
    await queryInterface.addConstraint('request_spare_parts', {
      fields: ['quantity_used'],
      type: 'check',
      where: { quantity_used: { [Sequelize.Op.gt]: 0 } },
      name: 'request_spare_parts_quantity_used_positive_ck',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('request_spare_parts');
    await queryInterface.dropTable('spare_parts');
  },
};
