export async function resetDatabase(): Promise<void> {
  const { sequelize } = await import('../../src/db/sequelize.js');

  await sequelize.query(`
    TRUNCATE TABLE
      request_spare_parts,
      request_assignees,
      request_status_history,
      maintenance_requests,
      equipment_passports,
      equipment,
      spare_parts,
      technicians,
      sites
    CASCADE
  `);
}

export async function closeDatabase(): Promise<void> {
  const { sequelize } = await import('../../src/db/sequelize.js');
  await sequelize.close();
}
