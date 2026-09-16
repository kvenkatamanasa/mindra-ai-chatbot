"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


  async function handleSignup(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError("Please enter your email.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: signupError } =
        await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/chat`,
          },
        });

      if (signupError) {
        setError(signupError.message);
        return;
      }

      /*
       * If Supabase immediately creates a session,
       * go directly to the chatbot.
       */
      if (data.session) {
        router.replace("/chat");
        router.refresh();
        return;
      }

      /*
       * If email confirmation is enabled,
       * Supabase does not create a session yet.
       */
      setSuccess(
        "Account created successfully. Please check your email and confirm your account before logging in."
      );

      setPassword("");
      setConfirmPassword("");
    } catch (signupError) {
      console.error(
        "Signup error:",
        signupError
      );

      setError(
        signupError instanceof Error
          ? signupError.message
          : "Signup failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-md">

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">

          {/* LOGO */}

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-lg font-bold text-white dark:bg-white dark:text-black">M</div>

          {/* TITLE */}

          <h1 className="mt-6 text-center text-2xl font-bold text-gray-900 dark:text-white">
            Create your account
          </h1>

          <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
            Start using Mindra
          </p>

          {/* FORM */}

          <form
            onSubmit={handleSignup}
            className="mt-6 space-y-4"
          >

            {/* EMAIL */}

            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-200"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@example.com"
                autoComplete="email"
                disabled={loading}
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-white dark:focus:ring-white"
              />
            </div>

            {/* PASSWORD */}

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-200"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="At least 6 characters"
                autoComplete="new-password"
                disabled={loading}
                required
                minLength={6}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-white dark:focus:ring-white"
              />
            </div>

            {/* CONFIRM PASSWORD */}

            <div>
              <label
                htmlFor="confirm-password"
                className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-200"
              >
                Confirm Password
              </label>

              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                placeholder="Repeat your password"
                autoComplete="new-password"
                disabled={loading}
                required
                minLength={6}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-white dark:focus:ring-white"
              />
            </div>

            {/* PASSWORD REQUIREMENT */}

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Password must contain at least 6
              characters.
            </p>

            {/* ERROR */}

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
              >
                {error}
              </div>
            )}

            {/* SUCCESS */}

            {success && (
              <div
                role="status"
                className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300"
              >
                {success}
              </div>
            )}

            {/* BUTTON */}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-black px-4 py-3 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent dark:border-black dark:border-t-transparent" />
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>

          </form>

          {/* LOGIN */}

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{" "}

            <Link
              href="/login"
              className="font-medium text-black hover:underline dark:text-white"
            >
              Sign in
            </Link>
          </p>

          {/* HOME */}

          <div className="mt-4 text-center">
            <Link
              href="/"
              className="text-xs text-gray-500 hover:underline dark:text-gray-400"
            >
              ← Back to Home
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}
