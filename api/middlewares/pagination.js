import createError from "http-errors";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

function parsePositiveInteger(value, name, defaultValue) {
  if (value === undefined) {
    return defaultValue;
  }
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) {
    throw createError(400, `Query parameter "${name}" must be a positive integer`);
  }
  return number;
}

/**
 * Reads `?page=` (default 1) and `?pageSize=` (default 20, max 100) and puts
 * { page, pageSize, skip } in req.pagination. Invalid values give 400.
 */
export function paginate(req, res, next) {
  const page = parsePositiveInteger(req.query.page, "page", 1);
  const pageSize = parsePositiveInteger(
    req.query.pageSize,
    "pageSize",
    DEFAULT_PAGE_SIZE,
  );
  if (pageSize > MAX_PAGE_SIZE) {
    throw createError(
      400,
      `Query parameter "pageSize" must be at most ${MAX_PAGE_SIZE}`,
    );
  }
  req.pagination = { page, pageSize, skip: (page - 1) * pageSize };
  next();
}

/**
 * Sets the pagination headers of a list response. The body stays a plain
 * array of items.
 */
export function setPaginationHeaders(res, { page, pageSize }, total) {
  res.set({
    "Pagination-Page": String(page),
    "Pagination-Page-Size": String(pageSize),
    "Pagination-Total": String(total),
  });
}

/** Headers a browser client must be allowed to read (CORS exposedHeaders). */
export const paginationHeaders = [
  "Pagination-Page",
  "Pagination-Page-Size",
  "Pagination-Total",
];
