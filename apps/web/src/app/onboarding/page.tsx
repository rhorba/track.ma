'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createVehicle, inviteUser } from '@/lib/api';
import { useAuth } from '@/lib/auth';

type Step = 1 | 2 | 3;

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 2: vehicle form
  const [vehicle, setVehicle] = useState({ name: '', plate: '', imei: '' });

  // Step 3: invite
  const [inviteEmail, setInviteEmail] = useState('');
  const [invited, setInvited] = useState(false);

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await createVehicle(vehicle);
      setStep(3);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to add vehicle');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await inviteUser(inviteEmail, 'fleet_manager');
      setInvited(true);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to send invite');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition';
  const primaryBtn = 'w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors';
  const ghostBtn = 'w-full py-2.5 px-4 border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg">T</div>
          <span className="text-2xl font-semibold tracking-tight dark:text-white">track.ma</span>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-6">
          {([1, 2, 3] as Step[]).map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                s < step ? 'bg-green-500 text-white' : s === step ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
              }`}>
                {s < step ? '✓' : s}
              </div>
              {s < 3 && <div className={`flex-1 h-0.5 ${s < step ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-800'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 p-8">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Welcome to track.ma</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Your organization is ready. Let's set up your fleet in 2 quick steps.
                </p>
              </div>
              {user && (
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 space-y-1">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Your account</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{user.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                  <span className="inline-block mt-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-full font-medium">Admin</span>
                </div>
              )}
              <button onClick={() => setStep(2)} className={primaryBtn}>
                Add your first vehicle →
              </button>
            </div>
          )}

          {/* Step 2: Add first vehicle */}
          {step === 2 && (
            <form onSubmit={handleAddVehicle} className="space-y-4">
              <div>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Add your first vehicle</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Connect a GPS device to start tracking.</p>
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">{error}</p>}
              {[
                { key: 'name', label: 'Vehicle name', placeholder: 'e.g. Truck #1' },
                { key: 'plate', label: 'License plate', placeholder: 'e.g. 12345-A-7' },
                { key: 'imei', label: 'Device IMEI', placeholder: '15-digit IMEI' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
                  <input
                    type="text"
                    required
                    placeholder={placeholder}
                    value={vehicle[key as keyof typeof vehicle]}
                    onChange={(e) => setVehicle((v) => ({ ...v, [key]: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setStep(3)} className={ghostBtn}>Skip</button>
                <button type="submit" disabled={loading} className={primaryBtn}>
                  {loading ? 'Adding…' : 'Add vehicle →'}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Invite teammate */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Invite a teammate</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Add a fleet manager or dispatcher to your team.</p>
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">{error}</p>}
              {invited ? (
                <div className="text-center space-y-4">
                  <p className="text-sm text-green-600 bg-green-50 dark:bg-green-950/30 px-3 py-2 rounded-lg">
                    Invite sent to {inviteEmail}!
                  </p>
                  <button onClick={() => router.push('/dashboard')} className={primaryBtn}>
                    Go to dashboard →
                  </button>
                </div>
              ) : (
                <form onSubmit={handleInvite} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email address</label>
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@company.ma"
                      className={inputCls}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => router.push('/dashboard')} className={ghostBtn}>
                      Skip, go to dashboard
                    </button>
                    <button type="submit" disabled={loading} className={primaryBtn}>
                      {loading ? 'Sending…' : 'Send invite →'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
