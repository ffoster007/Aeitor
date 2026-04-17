// actions/auth.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { addMinutes } from "date-fns";

import { prisma } from "@/lib/prisma";
import { verifyRefreshToken, hashToken } from "@/lib/jwt";
import { clearAuthCookies, getRefreshToken } from "@/lib/cookies";
import { requireUser } from "@/lib/session";
import {
  signUpSchema,
  signInSchema,
  verifyEmailSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";
import { createAndSendVerificationCode, verifyCode } from "@/lib/verification";
import { sendPasswordResetEmail } from "@/lib/email";
import { issueTokens } from "@/lib/auth-tokens";
import type { ActionResult } from "@/types/actions";

const BCRYPT_ROUNDS = 12; // Cost factor; 12 is suitable for production.
const RESET_TOKEN_EXPIRY_MINUTES = 30;

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "http://localhost:3000";
}

function getDefaultUsernameFromEmail(email: string): string {
  return email.split("@")[0] || "there";
}

function safeRedirectPath(input: string | null | undefined): string {
  if (!input) return "/dashboard";
  if (!input.startsWith("/")) return "/dashboard";
  if (input.startsWith("//")) return "/dashboard";
  return input;
}

async function startSignInVerificationChallenge(user: {
  id: string;
  email: string;
  username: string;
}): Promise<boolean> {
  try {
    await createAndSendVerificationCode(user.id, user.email, user.username);
  } catch {
    return false;
  }

  return true;
}

// ---------------------------------------------------------------
// SIGN UP
// ---------------------------------------------------------------
export async function signUpAction(formData: FormData): Promise<ActionResult> {
  // 1. Validate input
  const raw = {
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { username, email, password } = parsed.data;

  // 2. Check for duplicate email and username in a single query.
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { email: true, username: true },
  });

  if (existing) {
    return {
      success: false,
      errors: {
        ...(existing.email === email && { email: ["This email address is already in use."] }),
        ...(existing.username === username && { username: ["This username is already in use."] }),
      },
    };
  }

  // 3. Hash password
  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // 4. Create the user record in the database (emailVerified: false).
  let user: { id: string; email: string; username: string };
  try {
    user = await prisma.user.create({
      data: { 
        username, 
        email, 
        password: hashedPassword,
        emailVerified: false,
      },
      select: { id: true, email: true, username: true },
    });
  } catch {
    return { success: false, errors: { _form: ["Something went wrong. Please try again."] } };
  }

  // 5. Create and send the verification code.
  try {
    await createAndSendVerificationCode(user.id, user.email, user.username);
  } catch {
    return { success: false, errors: { _form: ["We could not send the email. Please try again."] } };
  }

  // 6. Store userId in query param for verification page
  const searchParams = new URLSearchParams({ userId: user.id });
  redirect(`/auth/verify?${searchParams.toString()}`);
}

// ---------------------------------------------------------------
// SIGN IN
// ---------------------------------------------------------------
export async function signInAction(formData: FormData): Promise<ActionResult> {
  // 1. Validate
  const raw = {
    username: formData.get("username"),
    password: formData.get("password"),
    redirectTo: formData.get("redirectTo"),
  };

  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { username, password } = parsed.data;
  const redirectTo = typeof raw.redirectTo === "string" ? raw.redirectTo : null;

  // 2. Look up the user. Use a broad message to prevent user enumeration.
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, email: true, username: true, password: true, emailVerified: true, deletedAt: true },
  });

  // Timing-safe compare: always compare, even when no user is found, to reduce timing attacks.
  const dummyHash = "$2b$12$invalidhashfortimingprotection00000000000000000000000";
  const isValid = await bcrypt.compare(password, user?.password ?? dummyHash);

  if (!user || !isValid) {
    return { success: false, errors: { _form: ["Username or Password is incorrect"] } };
  }

  if (user.deletedAt) {
    return { success: false, errors: { _form: ["Username or Password is incorrect"] } };
  }

  // 3. Every sign-in must complete email verification before issuing tokens.
  const canStartChallenge = await startSignInVerificationChallenge(
    { id: user.id, email: user.email, username: user.username },
  );

  if (!canStartChallenge) {
    return {
      success: false,
      errors: { _form: ["We could not send a verification email right now. Please try again."] },
    };
  }

  const searchParams = new URLSearchParams({
    userId: user.id,
    sent: "1",
    source: "signin",
  });

  const safeRedirectTo = safeRedirectPath(redirectTo);
  if (safeRedirectTo !== "/dashboard") {
    searchParams.set("redirectTo", safeRedirectTo);
  }

  redirect(`/auth/verify?${searchParams.toString()}`);
}

// ---------------------------------------------------------------
// SIGN OUT
// ---------------------------------------------------------------
export async function signOutAction(): Promise<void> {
  // Revoke the refresh token stored in the database.
  const rawRefreshToken = await getRefreshToken();
  if (rawRefreshToken) {
    const hashed = hashToken(rawRefreshToken);
    await prisma.refreshToken.deleteMany({ where: { token: hashed } }).catch(() => {});
  }

  await clearAuthCookies();
  revalidatePath("/", "layout");
  redirect("/auth/signin");
}

// ---------------------------------------------------------------
// REFRESH SESSION
// Called by middleware when the access token expires.
// ---------------------------------------------------------------
export async function refreshSessionAction(): Promise<boolean> {
  const rawRefreshToken = await getRefreshToken();
  if (!rawRefreshToken) return false;

  try {
    // 1. Verify JWT signature
    await verifyRefreshToken(rawRefreshToken);

    // 2. Check the hashed token in the database to prevent token reuse.
    const hashed = hashToken(rawRefreshToken);
    const stored = await prisma.refreshToken.findUnique({
      where: { token: hashed },
      include: { user: { select: { id: true, email: true, username: true, deletedAt: true } } },
    });

    if (!stored) {
      // This can happen during a concurrent refresh if another request already rotated the token.
      // Do not clear cookies immediately so we avoid logging the user out when another request succeeded.
      return false;
    }

    if (stored.expiresAt < new Date() || stored.user.deletedAt) {
      await clearAuthCookies();
      return false;
    }

    // 3. Rotate the refresh token so each token can be used only once.
    await prisma.refreshToken.delete({ where: { token: hashed } });

    // 4. Issue new tokens.
    await issueTokens(stored.user);
    return true;
  } catch {
    await clearAuthCookies();
    return false;
  }
}

// ---------------------------------------------------------------
// VERIFY EMAIL
// ---------------------------------------------------------------
export async function verifyEmailAction(userId: string, code: string, redirectTo?: string | null): Promise<ActionResult> {
  // 1. Validate input
  const parsed = verifyEmailSchema.safeParse({ code });
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { code: validatedCode } = parsed.data;

  // 2. Check the userId.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, username: true, emailVerified: true },
  });

  if (!user) {
    return { success: false, errors: { _form: ["User not found."] } };
  }

  // 3. Verify the email code.
  const isValid = await verifyCode(userId, validatedCode);
  if (!isValid) {
    return { success: false, errors: { code: ["The code is invalid or has expired."] } };
  }

  // 4. Issue tokens and set cookies.
  await issueTokens(user);

  // 5. Redirect to the dashboard.
  revalidatePath("/", "layout");
  redirect(safeRedirectPath(redirectTo));
}

// ---------------------------------------------------------------
// RESEND VERIFICATION CODE
// ---------------------------------------------------------------
export async function resendVerificationCodeAction(userId: string): Promise<ActionResult> {
  // 1. Check the userId.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, username: true, emailVerified: true },
  });

  if (!user) {
    return { success: false, errors: { _form: ["User not found."] } };
  }

  // 2. Create and send a new verification code for both initial verification and sign-in.
  try {
    await createAndSendVerificationCode(user.id, user.email, user.username);
  } catch {
    return { success: false, errors: { _form: ["We could not send the email. Please try again."] } };
  }

  return { success: true };
}

// ---------------------------------------------------------------
// CHANGE PASSWORD
// ---------------------------------------------------------------
export async function changePasswordAction(formData: FormData): Promise<ActionResult> {
  let sessionUser;
  try {
    sessionUser = await requireUser();
  } catch {
    return { success: false, errors: { _form: ["Unauthorized"] } };
  }

  const currentPassword = formData.get("currentPassword");
  const newPassword = formData.get("newPassword");
  const confirmPassword = formData.get("confirmPassword");

  if (
    typeof currentPassword !== "string" ||
    typeof newPassword !== "string" ||
    typeof confirmPassword !== "string"
  ) {
    return { success: false, errors: { _form: ["Invalid request data."] } };
  }

  // Validate new password strength
  const passwordSchema = signUpSchema.shape.password;
  const passwordResult = passwordSchema.safeParse(newPassword);
  if (!passwordResult.success) {
    return {
      success: false,
      errors: { newPassword: passwordResult.error.flatten().formErrors },
    };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, errors: { confirmPassword: ["The new passwords do not match."] } };
  }

  // Fetch user — only users with a password hash can change it
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.sub },
    select: { password: true },
  });

  if (!user) {
    return { success: false, errors: { _form: ["User not found."] } };
  }

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    return { success: false, errors: { currentPassword: ["Your current password is incorrect."] } };
  }

  if (currentPassword === newPassword) {
    return {
      success: false,
      errors: { newPassword: ["Your new password must be different from your current password."] },
    };
  }

  const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  await prisma.user.update({
    where: { id: sessionUser.sub },
    data: { password: hashedPassword },
  });

  return { success: true };
}

// ---------------------------------------------------------------
// FORGOT PASSWORD - REQUEST RESET
// ---------------------------------------------------------------
export async function requestPasswordResetAction(formData: FormData): Promise<ActionResult> {
  const raw = {
    email: formData.get("email"),
  };

  const parsed = requestPasswordResetSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const email = parsed.data.email.trim().toLowerCase();

  // Always use the same response to reduce the risk of user enumeration.
  const neutralSuccess: ActionResult = { success: true };

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      username: true,
      deletedAt: true,
      oauthAccounts: {
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!user || user.deletedAt) {
    return neutralSuccess;
  }

  // OAuth-linked accounts should manage credentials with the identity provider.
  if (user.oauthAccounts.length > 0) {
    return neutralSuccess;
  }

  try {
    const rawToken = randomBytes(32).toString("hex");
    const hashedToken = hashToken(rawToken);
    const expiresAt = addMinutes(new Date(), RESET_TOKEN_EXPIRY_MINUTES);

    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    await prisma.passwordResetToken.create({
      data: {
        token: hashedToken,
        userId: user.id,
        expiresAt,
      },
    });

    const resetUrl = `${getBaseUrl()}/auth/reset-password?token=${encodeURIComponent(rawToken)}`;
    await sendPasswordResetEmail(
      user.email,
      user.username || getDefaultUsernameFromEmail(user.email),
      resetUrl,
      RESET_TOKEN_EXPIRY_MINUTES,
    );
  } catch (error) {
    console.error("Password reset request failed", error);
  }

  return neutralSuccess;
}

// ---------------------------------------------------------------
// FORGOT PASSWORD - VALIDATE TOKEN
// ---------------------------------------------------------------
export async function validatePasswordResetTokenAction(token: string): Promise<ActionResult> {
  const cleanedToken = token.trim();

  const parsed = resetPasswordSchema.shape.token.safeParse(cleanedToken);
  if (!parsed.success) {
    return { success: false, errors: { _form: ["This reset link is invalid or has expired."] } };
  }

  const hashedToken = hashToken(cleanedToken);
  const tokenRow = await prisma.passwordResetToken.findUnique({
    where: { token: hashedToken },
    select: { id: true, expiresAt: true, usedAt: true },
  });

  if (!tokenRow || tokenRow.usedAt || tokenRow.expiresAt < new Date()) {
    return { success: false, errors: { _form: ["This reset link is invalid or has expired."] } };
  }

  return { success: true };
}

// ---------------------------------------------------------------
// FORGOT PASSWORD - RESET PASSWORD
// ---------------------------------------------------------------
export async function resetPasswordAction(formData: FormData): Promise<ActionResult> {
  const raw = {
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { token, password } = parsed.data;
  const hashedToken = hashToken(token);

  const tokenRow = await prisma.passwordResetToken.findUnique({
    where: { token: hashedToken },
    include: {
      user: {
        select: {
          id: true,
          password: true,
          deletedAt: true,
          oauthAccounts: {
            select: { id: true },
            take: 1,
          },
        },
      },
    },
  });

  if (
    !tokenRow
    || tokenRow.usedAt
    || tokenRow.expiresAt < new Date()
    || tokenRow.user.deletedAt
    || tokenRow.user.oauthAccounts.length > 0
  ) {
    return { success: false, errors: { _form: ["This reset link is invalid or has expired."] } };
  }

  const isSamePassword = await bcrypt.compare(password, tokenRow.user.password);
  if (isSamePassword) {
    return { success: false, errors: { password: ["Please choose a different password."] } };
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

  try {
    await prisma.$transaction(async (tx) => {
      const consumed = await tx.passwordResetToken.updateMany({
        where: {
          id: tokenRow.id,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { usedAt: new Date() },
      });

      if (consumed.count !== 1) {
        throw new Error("RESET_TOKEN_INVALID");
      }

      await tx.user.update({
        where: { id: tokenRow.userId },
        data: { password: hashedPassword },
      });

      await tx.passwordResetToken.deleteMany({
        where: {
          userId: tokenRow.userId,
          id: { not: tokenRow.id },
        },
      });

      // Invalidate all existing sessions so only the new password can be used to sign in.
      await tx.refreshToken.deleteMany({ where: { userId: tokenRow.userId } });
    });
  } catch {
    return { success: false, errors: { _form: ["This reset link is invalid or has expired."] } };
  }

  return { success: true };
}
