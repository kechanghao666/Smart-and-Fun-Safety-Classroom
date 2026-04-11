import type { PaginatedResponse, PaginationQuery } from "../types/contracts";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

export interface PaginationOptions {
  page: number;
  pageSize: number;
  query?: string;
}

function normalizePositiveInteger(value: number | undefined, fallback: number) {
  if (
    value === undefined ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    value <= 0
  ) {
    return fallback;
  }

  return value;
}

export function resolvePaginationQuery(
  query: PaginationQuery | undefined,
  defaults?: Partial<PaginationOptions>,
): PaginationOptions {
  const page = normalizePositiveInteger(
    query?.page,
    defaults?.page ?? DEFAULT_PAGE,
  );
  const pageSize = Math.min(
    normalizePositiveInteger(query?.pageSize, defaults?.pageSize ?? DEFAULT_PAGE_SIZE),
    MAX_PAGE_SIZE,
  );
  const normalizedQuery = typeof query?.query === "string" ? query.query.trim() : "";

  return {
    page,
    pageSize,
    query: normalizedQuery || defaults?.query,
  };
}

export function paginateItems<T>(
  items: T[],
  pagination: PaginationOptions,
): PaginatedResponse<T> {
  const total = items.length;
  const pageSize = normalizePositiveInteger(pagination.pageSize, DEFAULT_PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(pagination.page, totalPages);
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    total,
    totalPages,
  };
}
