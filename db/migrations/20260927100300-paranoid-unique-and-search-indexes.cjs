'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('equipment', 'equipment_serial_number_key');
    await queryInterface.addIndex('equipment', ['serial_number'], {
      name: 'equipment_serial_number_active_uk',
      unique: true,
      where: { deleted_at: null },
    });

    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
    await queryInterface.addIndex('equipment', ['name'], {
      name: 'equipment_name_trgm_idx',
      using: 'gin',
      operator: 'gin_trgm_ops',
    });
    await queryInterface.addIndex('equipment', ['serial_number'], {
      name: 'equipment_serial_number_trgm_idx',
      using: 'gin',
      operator: 'gin_trgm_ops',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('equipment', 'equipment_serial_number_trgm_idx');
    await queryInterface.removeIndex('equipment', 'equipment_name_trgm_idx');

    await queryInterface.removeIndex('equipment', 'equipment_serial_number_active_uk');
    await queryInterface.addConstraint('equipment', {
      fields: ['serial_number'],
      type: 'unique',
      name: 'equipment_serial_number_key',
    });
  },
};
