// lib/session.ts
// Used by Server Components and Server Actions to read the user from the access token.

import { verifyAccessToken, type AccessTokenPayload } from "./jwt";
import { getAccessToken } from "./cookies";
import { prisma } from "./prisma";

export async function getCurrentUser(): Promise<AccessTokenPayload | null> {
  try {
    const token = await getAccessToken();
    if (!token) return null;
    return await verifyAccessToken(token);
  } catch {
    // The token is expired or invalid; middleware will handle the refresh flow.
    return null;
  }
}

// Require auth for guarded Server Components.
export async function requireUser(): Promise<AccessTokenPayload> {
  const user = await getCurrentUser();
  if (!user) {
    // Do not redirect here because middleware already handles that.
    // Throw instead so the caller or an error boundary can decide what to do.
    throw new Error("Unauthorized");
  }

  const activeUser = await prisma.user.findUnique({
    where: { id: user.sub },
    select: { id: true, deletedAt: true },
  });

  if (!activeUser || activeUser.deletedAt) {
    throw new Error("Unauthorized");
  }

  return user;
}