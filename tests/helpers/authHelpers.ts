import request from 'supertest';
import type { Express } from 'express';
import type { Role } from '../../src/models/user.model.js';

let counter = 0;

export interface TestUser {
  token: string;
  userId: string;
  email: string;
  technicianId: string | null;
}

export async function registerAndLogin(
  app: Express,
  role: Role = 'viewer',
  technicianId?: string,
): Promise<TestUser> {
  counter += 1;
  const email = `user_${Date.now()}_${counter}@example.com`;
  const password = 'Passw0rd123';

  await request(app).post('/api/auth/register').send({ email, name: 'Test User', password });

  let resolvedTechnicianId: string | null = null;
  if (role !== 'viewer') {
    const { UserModel } = await import('../../src/models/user.model.js');

    if (role === 'technician') {
      if (technicianId) {
        resolvedTechnicianId = technicianId;
      } else {
        const { TechnicianModel } = await import('../../src/models/technician.model.js');
        const tech = await TechnicianModel.create({
          fullName: 'Test Technician',
          specialization: 'Test',
          badgeNumber: `TECH-TEST-${Date.now()}-${counter}`,
        });
        resolvedTechnicianId = tech.id;
      }
    }

    await UserModel.update({ role, technicianId: resolvedTechnicianId }, { where: { email } });
  }

  const loginRes = await request(app).post('/api/auth/login').send({ email, password });

  return {
    token: loginRes.body.data.accessToken as string,
    userId: loginRes.body.data.user.id as string,
    email,
    technicianId: resolvedTechnicianId,
  };
}

export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}
