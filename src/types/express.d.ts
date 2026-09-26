declare global {
  namespace Express {
    interface Request {
      id: string;
      valid: {
        params: unknown;
        query: unknown;
        body: unknown;
      };
    }
  }
}

export {};
