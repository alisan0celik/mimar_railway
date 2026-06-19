import { SetMetadata } from "@nestjs/common";

export const REQUIRE_APPROVED_KEY = "requireApproved";

/** Requires company membership with approvalStatus === approved. */
export const RequireApproved = () => SetMetadata(REQUIRE_APPROVED_KEY, true);
