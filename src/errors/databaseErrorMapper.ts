export interface MappedDatabaseError {
  status: number;
  code: string;
  message: string;
}

const SQLSTATE_MAP: Record<string, MappedDatabaseError> = {
  '23505': { status: 409, code: 'CONFLICT', message: 'Запись с такими данными уже существует' },
  '23503': {
    status: 422,
    code: 'UNPROCESSABLE_ENTITY',
    message: 'Ссылка на несуществующую запись',
  },
  '23502': { status: 400, code: 'BAD_REQUEST', message: 'Не заполнено обязательное поле' },
  '23514': {
    status: 422,
    code: 'UNPROCESSABLE_ENTITY',
    message: 'Значение не удовлетворяет ограничениям',
  },
  '40001': {
    status: 409,
    code: 'CONFLICT',
    message: 'Конфликт параллельных изменений, повторите запрос',
  },
  '40P01': {
    status: 409,
    code: 'CONFLICT',
    message: 'Взаимная блокировка в базе данных, повторите запрос',
  },
};

interface DatabaseErrorShape {
  parent?: { code?: string };
  original?: { code?: string };
  code?: string;
}

export function mapDatabaseError(err: unknown): MappedDatabaseError | null {
  if (typeof err !== 'object' || err === null) return null;

  const candidate = err as DatabaseErrorShape;
  const sqlState = candidate.parent?.code ?? candidate.original?.code ?? candidate.code;
  if (!sqlState) return null;

  return SQLSTATE_MAP[sqlState] ?? null;
}
