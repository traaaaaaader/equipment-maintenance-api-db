export interface ListParams<T> {
  filters?: T;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface ListResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
