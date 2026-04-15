"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Mail } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { requestPasswordResetAction } from "@/actions/auth";
import type { ActionResult } from "@/types/actions";

const NEUTRAL_MESSAGE = "If an account exists for this email, we sent a reset link. Please check your inbox.";


export default function ForgotPasswordPage() {
  const [result, setResult] = useState<ActionResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showNeutralSuccess, setShowNeutralSuccess] = useState(false);

  const errors = result && !result.success ? result.errors : {};

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setShowNeutralSuccess(false);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await requestPasswordResetAction(formData);
      setResult(res);
      if (res.success) {
        setShowNeutralSuccess(true);
      }
    });
  }

  return (
    <main
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: "#f0ede6",
        backgroundImage: `
          linear-gradient(rgba(0,0,0,0.045) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,0,0,0.045) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
        fontFamily: "'Georgia', serif",
      }}
    >
      <nav className="flex items-center justify-between px-8 py-5 max-w-5xl mx-auto w-full">
        <Link href="/">
          <div className="w-9 h-9">
            <Image src="/aeitor.png" alt="logo" width={24} height={24} />
          </div>
        </Link>

        <p className="text-sm" style={{ color: "#666", fontFamily: "'Helvetica Neue', sans-serif" }}>
          Remember your password?{" "}
          <Link href="/auth/signin" className="underline underline-offset-2 hover:text-black transition-colors" style={{ color: "#333" }}>
            Sign in
          </Link>
        </p>
      </nav>

      <section className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-5xl grid gap-10 lg:grid-cols-[1.02fr_0.98fr] items-center">

          <div className="w-full max-w-sm justify-self-center lg:justify-self-end">
            <div className="mb-8 text-center lg:text-left">
              <p
                className="text-xs uppercase tracking-widest mb-4"
                style={{ color: "#999", fontFamily: "'Helvetica Neue', sans-serif", letterSpacing: "0.15em" }}
              >
                Request reset
              </p>
              <h2
                className="text-4xl leading-tight"
                style={{ color: "#111", fontFamily: "'Georgia', 'Times New Roman', serif", fontWeight: 400 }}
              >
                Send reset
                <br />
                instructions.
              </h2>
            </div>

            <div
              className="rounded-2xl border border-neutral-300 overflow-hidden shadow-sm"
              style={{ backgroundColor: "rgba(240,237,230,0.85)", backdropFilter: "blur(8px)" }}
            >
              {showNeutralSuccess && (
                <div className="mx-5 mt-5 rounded-xl border px-3.5 py-3" style={{ borderColor: "#c9d7c5", backgroundColor: "#edf4ea" }}>
                  <p className="text-xs leading-relaxed" style={{ color: "#33523b", fontFamily: "'Helvetica Neue', sans-serif" }}>
                    {NEUTRAL_MESSAGE}
                  </p>
                </div>
              )}

              {errors._form && (
                <div className="mx-5 mt-5 rounded-xl border px-3.5 py-3" style={{ borderColor: "#e7c7c2", backgroundColor: "#f9ece9" }}>
                  <p className="text-xs leading-relaxed" style={{ color: "#7a3d32", fontFamily: "'Helvetica Neue', sans-serif" }}>
                    {errors._form[0]}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-3" noValidate>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-xs" style={{ color: "#666", fontFamily: "'Helvetica Neue', sans-serif" }}>
                    Email
                  </label>
                  <div className="relative">
                    <Mail size={14} strokeWidth={1.8} className="absolute left-3.5 top-1/2 -translate-y-1/2" color="#8b8b8b" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@company.com"
                      disabled={isPending}
                      className="w-full rounded-xl border px-10 py-2.5 text-sm outline-none transition-colors"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.7)",
                        color: "#111",
                        fontFamily: "'Helvetica Neue', sans-serif",
                        borderColor: errors.email ? "#ef4444" : "#d1d5db",
                      }}
                      required
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-500" style={{ fontFamily: "'Helvetica Neue', sans-serif" }}>
                      {errors.email[0]}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="mt-1 w-full py-2.5 rounded-xl text-sm text-white hover:opacity-80 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  style={{ backgroundColor: "#1a1a1a", fontFamily: "'Helvetica Neue', sans-serif" }}
                >
                  {isPending ? (
                    <>
                      <Spinner size={14} /> Sending link...
                    </>
                  ) : (
                    <>
                      Send reset link
                      <ArrowRight size={14} strokeWidth={2} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
