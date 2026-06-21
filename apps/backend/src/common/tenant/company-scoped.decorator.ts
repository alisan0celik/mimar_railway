import { SetMetadata } from "@nestjs/common";

export const COMPANY_SCOPED_PARAM_KEY = "companyScopedParam";

/**
 * Ensures the route param matches the caller's companyId.
 * Example: `@CompanyScoped("id")` on `PATCH /companies/:id`.
 */
export const CompanyScoped = (paramName = "id") =>
  SetMetadata(COMPANY_SCOPED_PARAM_KEY, paramName);
