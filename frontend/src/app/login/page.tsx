'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      router.push('/'); // Redirect to dashboard after successful login
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.message) {
        setError(err.message);
      } else {
        setError('Invalid username/email or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-secondary/60 to-white px-4 py-10 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="h-16 w-16 rounded-2xl bg-gradient-primary shadow-lg flex items-center justify-center">
            <img
              src="/logo.png"
              alt="EggFarm Pro"
              className="h-10 w-10 object-contain"
            />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
              Welcome back
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Sign in to manage your farm operations and dashboard.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 px-6 py-6 sm:px-7 sm:py-7 dark:bg-gray-800 dark:border-gray-700">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2.5 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="email-address"
                className="form-label text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Username or Email
              </label>
              <input
                id="email-address"
                name="email"
                type="text"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input bg-white py-2.5 px-3 text-sm placeholder:text-gray-400 dark:bg-gray-700 dark:text-white"
                placeholder="e.g. admin or admin@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="form-label text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input bg-white py-2.5 px-3 text-sm placeholder:text-gray-400 dark:bg-gray-700 dark:text-white"
                placeholder="Enter your password"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Secure login • Encrypted connection</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full flex justify-center py-2.5 text-sm font-medium transition-all duration-200 hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
          <span className="font-medium text-gray-600 dark:text-gray-300">Demo credentials</span>{' '}
          • <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded dark:bg-gray-700">admin / admin123</span>
        </div>
      </div>
    </div>
  );
}