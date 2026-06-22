'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { acceptInvite } from '@/lib/api';

function AcceptInviteForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (!token) { setError('Invalid invite link'); return; }
    setError('');
    setLoading(true);
    try {
      await acceptInvite(token, name, password);
      setDone(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to accept invite');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg">T</div>
          <span className="text-2xl font-semibold tracking-tight dark:text-white">track.ma</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 p-8">
          {done ? (
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto text-2xl">✓</div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Account created!</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Redirecting to login…</p>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">Accept invitation</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Set up your account to join the team.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Your name</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Full name" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
                  <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Confirm password</label>
                  <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat password" className={inputCls} />
                </div>
                {error && (
                  <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">{error}</p>
                )}
                {!token && (
                  <p className="text-sm text-red-500">No invite token found in the URL. Please use the link from your email.</p>
                )}
                <button type="submit" disabled={loading || !token}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors">
                  {loading ? 'Creating account…' : 'Create account'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense>
      <AcceptInviteForm />
    </Suspense>
  );
}
