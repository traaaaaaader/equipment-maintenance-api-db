import { Op } from 'sequelize';
import { RefreshTokenModel } from '../models/refreshToken.model.js';

export interface RefreshTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

function toRecord(row: RefreshTokenModel): RefreshTokenRecord {
  return {
    id: row.id,
    userId: row.userId,
    tokenHash: row.tokenHash,
    expiresAt: row.expiresAt,
    revokedAt: row.revokedAt ?? null,
  };
}

export class RefreshTokenRepository {
  async create(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    userAgent?: string | null;
    ip?: string | null;
  }): Promise<RefreshTokenRecord> {
    const row = await RefreshTokenModel.create(data);
    return toRecord(row);
  }

  async findActiveByHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    const row = await RefreshTokenModel.findOne({
      where: { tokenHash, revokedAt: { [Op.is]: null }, expiresAt: { [Op.gt]: new Date() } },
    });
    return row ? toRecord(row) : null;
  }

  async revokeByHash(tokenHash: string): Promise<void> {
    await RefreshTokenModel.update({ revokedAt: new Date() }, { where: { tokenHash } });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await RefreshTokenModel.update(
      { revokedAt: new Date() },
      { where: { userId, revokedAt: { [Op.is]: null } } },
    );
  }
}

export const refreshTokenRepository = new RefreshTokenRepository();
