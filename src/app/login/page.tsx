"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { login } from "@/lib/auth";

/**
 * SECURE LOGIN PAGE
 *
 * Security features:
 * 1. Uses server action (login) - credentials never exposed to client bundle
 * 2. No token storage in localStorage/sessionStorage (XSS protection)
 * 3. Tokens stored in httpOnly cookies by server
 * 4. Client only receives success/error status, never sees tokens
 */

// Validation schema using Yup
const loginSchema = Yup.object().shape({
  username: Yup.string()
    .required("Username is required")
    .min(3, "Username must be at least 3 characters"),
  password: Yup.string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters"),
});

// Initial form values
interface LoginFormValues {
  username: string;
  password: string;
}

const initialValues: LoginFormValues = {
  username: "",
  password: "",
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  // Get redirect URL from query params, default to home page
  const redirectUrl = searchParams.get("redirect") || "/";

  const handleSubmit = async (
    values: LoginFormValues,
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void },
  ) => {
    setError(null);

    try {
      // SECURITY: Server action handles authentication and sets httpOnly cookies
      // No tokens are ever exposed to the client
      const result = await login(values.username, values.password);

      if (result.success) {
        // Redirect to the original page or home page on successful login
        // Middleware will now allow access to protected routes
        router.push(redirectUrl);
      } else {
        setError(result.error);
        setSubmitting(false);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error("Login error:", err);
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-900 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
            Simple Invoice Management System
          </p>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={loginSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="mt-8 space-y-6">
              <div className="space-y-4 rounded-md shadow-sm">
                <div>
                  <label htmlFor="username" className="sr-only">
                    Username
                  </label>
                  <Field
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    disabled={isSubmitting}
                    className="relative block w-full appearance-none rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:z-10 focus:border-zinc-500 focus:outline-none focus:ring-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 sm:text-sm"
                    placeholder="Username"
                  />
                  <ErrorMessage
                    name="username"
                    component="div"
                    className="mt-1 text-sm text-red-600 dark:text-red-400"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="sr-only">
                    Password
                  </label>
                  <Field
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    disabled={isSubmitting}
                    className="relative block w-full appearance-none rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:z-10 focus:border-zinc-500 focus:outline-none focus:ring-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 sm:text-sm"
                    placeholder="Password"
                  />
                  <ErrorMessage
                    name="password"
                    component="div"
                    className="mt-1 text-sm text-red-600 dark:text-red-400"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
                  {error}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative flex w-full justify-center rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  {isSubmitting ? "Signing in..." : "Sign in"}
                </button>
              </div>
            </Form>
          )}
        </Formik>

        {/* Test credentials info - Remove in production */}
        <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
          <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Test Credentials:
          </h3>
          <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
            <p>
              <span className="font-medium">Username:</span> 94756921275
            </p>
            <p>
              <span className="font-medium">Password:</span> Password@12345
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
