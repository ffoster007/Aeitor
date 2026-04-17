// lib/jwt.ts
// Server-only code. Do not import this into a Client Component.

import { SignJWT, jwtVerify } from "jose";
import { createHash } from "crypto";

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error("JWT_SECRET environment variable is not set. Please add JWT_SECRET to your .env file.");
}
const secret = new TextEncoder().encode(jwtSecret);

// ---------------------------------------------------------------
// Payload types
// ---------------------------------------------------------------
export interface AccessTokenPayload {
  sub: string;       // user id
  email: string;
  username: string;
}

export interface RefreshTokenPayload {
  sub: string;       // user id
  jti: string;       // unique token id used for revocation
}

// ---------------------------------------------------------------
// Access Token (short-lived: 15m)
// ---------------------------------------------------------------
export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_ACCESS_EXPIRES_IN ?? "15m")
    .sign(secret);
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as AccessTokenPayload;
}

// ---------------------------------------------------------------
// Refresh Token (long-lived: 7d)
// ---------------------------------------------------------------
export async function signRefreshToken(payload: RefreshTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_REFRESH_EXPIRES_IN ?? "7d")
    .sign(secret);
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as RefreshTokenPayload;
}

// ---------------------------------------------------------------
// Hash the refresh token before storing it in the database, similar to a password hash.
// If the database is ever exposed, the raw token still cannot be used directly.
// ---------------------------------------------------------------
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}