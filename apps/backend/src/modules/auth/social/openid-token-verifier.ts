import { createPublicKey, verify as verifySignature } from "crypto";
import { UnauthorizedException } from "@nestjs/common";

type JsonWebKeySet = {
  keys: Array<Record<string, unknown> & { kid?: string; alg?: string }>;
};

export type VerifiedIdToken = Record<string, unknown> & {
  aud?: string | string[];
  email?: string;
  exp?: number;
  iat?: number;
  iss?: string;
  name?: string;
  sub?: string;
};

type VerifyOptions = {
  audience: string[];
  issuer: string | ((issuer: string, payload: VerifiedIdToken) => boolean);
  jwksUrl: string;
  providerName: string;
  token: string;
};

const jwksCache = new Map<string, { expiresAt: number; jwks: JsonWebKeySet }>();

function decodeBase64Url(value: string): Buffer {
  return Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function decodeJson<T>(value: string): T {
  return JSON.parse(decodeBase64Url(value).toString("utf8")) as T;
}

function hasAudience(payloadAudience: string | string[] | undefined, allowedAudiences: string[]) {
  const audiences = Array.isArray(payloadAudience) ? payloadAudience : payloadAudience ? [payloadAudience] : [];
  return audiences.some((audience) => allowedAudiences.includes(audience));
}

async function getJwks(jwksUrl: string): Promise<JsonWebKeySet> {
  const cached = jwksCache.get(jwksUrl);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.jwks;
  }

  const response = await fetch(jwksUrl);
  if (!response.ok) {
    throw new UnauthorizedException("Sosyal giriş anahtarları alınamadı");
  }

  const jwks = (await response.json()) as JsonWebKeySet;
  jwksCache.set(jwksUrl, { expiresAt: Date.now() + 60 * 60 * 1000, jwks });
  return jwks;
}

export async function verifyOpenIdToken({
  audience,
  issuer,
  jwksUrl,
  providerName,
  token,
}: VerifyOptions): Promise<VerifiedIdToken> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new UnauthorizedException(`${providerName} token formatı geçersiz`);
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = decodeJson<{ alg?: string; kid?: string }>(encodedHeader);
  const payload = decodeJson<VerifiedIdToken>(encodedPayload);

  if (header.alg !== "RS256" || !header.kid) {
    throw new UnauthorizedException(`${providerName} token imzası geçersiz`);
  }

  const jwks = await getJwks(jwksUrl);
  const key = jwks.keys.find((item) => item.kid === header.kid);
  if (!key) {
    jwksCache.delete(jwksUrl);
    throw new UnauthorizedException(`${providerName} token anahtarı bulunamadı`);
  }

  const publicKey = createPublicKey({ key, format: "jwk" } as any);
  const isValidSignature = verifySignature(
    "RSA-SHA256",
    Buffer.from(`${encodedHeader}.${encodedPayload}`),
    publicKey,
    decodeBase64Url(encodedSignature),
  );

  if (!isValidSignature) {
    throw new UnauthorizedException(`${providerName} token imzası doğrulanamadı`);
  }

  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp < now) {
    throw new UnauthorizedException(`${providerName} token süresi dolmuş`);
  }

  const issuerIsValid =
    typeof issuer === "string"
      ? payload.iss === issuer
      : !!payload.iss && issuer(payload.iss, payload);
  if (!issuerIsValid) {
    throw new UnauthorizedException(`${providerName} token sağlayıcısı geçersiz`);
  }

  const allowedAudiences = audience.filter(Boolean);
  if (allowedAudiences.length === 0 || !hasAudience(payload.aud, allowedAudiences)) {
    throw new UnauthorizedException(`${providerName} uygulama kimliği geçersiz`);
  }

  return payload;
}
