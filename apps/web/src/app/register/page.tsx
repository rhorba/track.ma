'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { register } from '@/lib/api';
import { saveToken } from '@/lib/auth';

const PLAN_LABELS: Record<string, string> = {
  trial: 'Démarrage (Gratuit)',
  starter: 'Pro — 299 MAD/mois',
  pro: 'Entreprise — 799 MAD/mois',
};

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const plan = params.get('plan') ?? 'trial';

  const [form, setForm] = useState({ name: '', email: '', password: '', organizationName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await register(form);
      if (data.accessToken) {
        saveToken(data.accessToken);
        router.push('/onboarding');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <Link href="/" className="text-2xl font-bold text-emerald-400 tracking-tight">track.ma</Link>
        </div>

        {plan !== 'trial' && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm px-4 py-2.5 rounded-xl mb-4 text-center">
            Plan sélectionné : <strong>{PLAN_LABELS[plan]}</strong>
          </div>
        )}

        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8">
          <h1 className="text-xl font-semibold text-white mb-1">Créer votre compte</h1>
          <p className="text-sm text-slate-400 mb-6">30 jours gratuits, sans carte bancaire</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Votre nom" type="text" value={form.name} onChange={set('name')} placeholder="Ali Berrada" />
            <Field label="Email professionnel" type="email" value={form.email} onChange={set('email')} placeholder="ali@entreprise.ma" />
            <Field label="Mot de passe" type="password" value={form.password} onChange={set('password')} placeholder="8 caractères minimum" />
            <Field label="Nom de votre entreprise" type="text" value={form.organizationName} onChange={set('organizationName')} placeholder="Transport Express SARL" />

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              {loading ? 'Création du compte…' : 'Créer mon compte gratuitement'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-emerald-400 hover:text-emerald-300">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, type, value, onChange, placeholder,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      <input
        type={type}
        required
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-700 bg-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
      />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
