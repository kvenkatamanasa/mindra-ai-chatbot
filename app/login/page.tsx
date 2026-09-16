"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const {
        error,
      } =
        await supabase.auth.signInWithPassword(
          {
            email: email.trim(),
            password,
          }
        );

      if (error) {
        setError(error.message);
        return;
      }

      /*
       * Give Supabase time to persist
       * the browser session.
       */
      await new Promise(
        (resolve) =>
          setTimeout(resolve, 300)
      );

      router.replace(searchParams.get("next")?.startsWith("/") ? searchParams.get("next")! : "/chat");
      router.refresh();
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Login failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-lg font-bold text-white">M</div>

          <h1 className="mt-6 text-center text-2xl font-bold">
            Welcome back
          </h1>

          <p className="mt-2 text-center text-sm text-gray-500">
            Sign in to Mindra
          </p>

          <form
            onSubmit={handleLogin}
            className="mt-6 space-y-4"
          >

            <div>
              <label className="mb-1 block text-sm font-medium">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-black dark:border-gray-700 dark:bg-gray-950"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="Your password"
                autoComplete="current-password"
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-black dark:border-gray-700 dark:bg-gray-950"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-black px-4 py-3 font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
            >
              {loading
                ? "Signing in..."
                : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{" "}

            <Link
              href="/signup"
              className="font-medium text-black hover:underline dark:text-white"
            >
              Create account
            </Link>
          </p>

        </div>
      </div>
    </main>
  );
}