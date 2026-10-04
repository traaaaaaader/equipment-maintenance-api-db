declare global {
  namespace Express {
    interface Request {
      id: string;
      valid: {
        params: unknown;
        query: unknown;
        body: unknown;
      };
      user?: {
        id: string;
        role: Role;
        technicianId: string | null;
      };
    }
  }
}

export {};
