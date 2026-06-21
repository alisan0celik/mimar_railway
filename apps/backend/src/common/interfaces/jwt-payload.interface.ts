export interface JwtPayload {
  sub: string;
  email: string;
  companyId: string | null;
  approvalStatus: string;
}

export interface JwtPayloadWithRefresh extends JwtPayload {
  refreshToken: string;
}
