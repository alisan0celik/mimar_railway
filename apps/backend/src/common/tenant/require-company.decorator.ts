import { SetMetadata } from "@nestjs/common";

export const REQUIRE_COMPANY_KEY = "requireCompany";

/** Requires an authenticated user with an active company membership. */
export const RequireCompany = () => SetMetadata(REQUIRE_COMPANY_KEY, true);
