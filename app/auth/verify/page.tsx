"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyEmailAction, resendVerificationCodeAction } from "@/actions/auth";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const sent = searchParams.get("sent") === "1";
  const source = searchParams.get("source");

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  if (!userId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900">Error</h1>
            <p className="mt-2 text-slate-600">Invalid verification link</p>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await verifyEmailAction(userId, code);

    if (!result.success) {
      setError(result.errors?.code?.[0] || result.errors?._form?.[0] || "Verification failed");
      setIsLoading(false);
    }
    // If successful, redirect happens in action
  };

  const handleResend = async () => {
    setIsResending(true);
    setResendSuccess(false);

    const result = await resendVerificationCodeAction(userId);

    if (result.success) {
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } else {
      setError(result.errors?._form?.[0] || "Failed to resend code");
    }

    setIsResending(false);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(value);
    setError("");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Verify Email</h1>
          <p className="mt-2 text-slate-600">
            Enter the 6-digit code we sent to your email
          </p>
        </div>

        {sent && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-3">
            <p className="text-sm text-green-700">
              {source === "signin"
                ? "This account is not verified yet. We sent a new 6-digit code to your email."
                : "Verification code sent. Check your email inbox."}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Code Input */}
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-slate-700">
              Verification Code
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              placeholder="000000"
              value={code}
              onChange={handleCodeChange}
              maxLength={6}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-center font-mono text-3xl font-bold tracking-widest text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Resend Success Message */}
          {resendSuccess && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3">
              <p className="text-sm text-green-700">Code sent! Check your email.</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={code.length !== 6 || isLoading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            {isLoading ? "Verifying..." : "Verify Email"}
          </button>

          {/* Resend Link */}
          <div className="text-center">
            <p className="text-sm text-slate-600">
              Didn't receive code?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="font-medium text-blue-600 hover:text-blue-700 disabled:text-slate-400"
              >
                {isResending ? "Sending..." : "Resend"}
              </button>
            </p>
          </div>
        </form>

        {/* Back to Sign In */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-600">
            Already verified?{" "}
            <button
              onClick={() => router.push("/auth/signin")}
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
