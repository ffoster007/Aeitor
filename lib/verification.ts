// lib/verification.ts

import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { addMinutes } from "date-fns";

const VERIFICATION_CODE_LENGTH = 6;
const VERIFICATION_CODE_EXPIRY = 10; // minutes
const MAX_ATTEMPTS = 5;

/**
 * Generate a random 6-digit code
 */
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Create and send verification code to user
 */
export async function createAndSendVerificationCode(
  userId: string,
  email: string,
  username: string,
): Promise<void> {
  // Delete previous codes for this user
  await prisma.verificationCode.deleteMany({ where: { userId } });

  // Generate new code
  const code = generateCode();
  const expiresAt = addMinutes(new Date(), VERIFICATION_CODE_EXPIRY);

  // Save code to database
  await prisma.verificationCode.create({
    data: {
      code,
      userId,
      expiresAt,
    },
  });

  // Send email
  await sendVerificationEmail(email, code, username);
}

/**
 * Verify the code provided by user
 */
export async function verifyCode(userId: string, code: string): Promise<boolean> {
  const verification = await prisma.verificationCode.findFirst({
    where: { userId },
  });

  if (!verification) {
    return false;
  }

  // Check if code has expired
  if (verification.expiresAt < new Date()) {
    return false;
  }

  // Check if too many attempts
  if (verification.attempts >= MAX_ATTEMPTS) {
    return false;
  }

  // Check if code matches
  const isValid = verification.code === code;

  if (!isValid) {
    // Increment attempts
    await prisma.verificationCode.update({
      where: { id: verification.id },
      data: { attempts: { increment: 1 } },
    });
    return false;
  }

  // Mark user as email verified
  await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: true },
  });

  // Delete verification code
  await prisma.verificationCode.delete({
    where: { id: verification.id },
  });

  return true;
}

/**
 * Check if user has verified email
 */
export async function isEmailVerified(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true },
  });

  return user?.emailVerified ?? false;
}
