'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { getTeam, inviteUser, updateUserRole } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

const ROLES = ['org_admin', 'fleet_manager', 'viewer', 'driver'] as const;

const ROLE_LABELS: Record<string, string> = {
  org_admin: 'Admin',
  fleet_manager: 'Fleet Manager',
  viewer: 'Viewer',
  driver: 'Driver',
};

const ROLE_COLORS: Record<string, string> = {
  org_admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  fleet_manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  viewer: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  driver: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

export default function AdminPage() {
  const { user } = useAuth();
  const { data: team = [], mutate } = useSWR<TeamMember[]>('team', getTeam);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteError('');
    try {
      await inviteUser(inviteEmail, inviteRole);
      setInviteSuccess(`Invite sent to ${inviteEmail}`);
      setInviteEmail('');
      setTimeout(() => { setShowInvite(false); setInviteSuccess(''); }, 2000);
    } catch (err: any) {
      setInviteError(err?.response?.data?.message ?? 'Failed to send invite');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRoleChange = async (memberId: string, role: string) => {
    setUpdatingRole(memberId);
    try {
      await updateUserRole(memberId, role);
      await mutate();
    } finally {
      setUpdatingRole(null);
    }
  };

  const isAdmin = user?.role === 'org_admin';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Team</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{team.length} members</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            + Invite member
          </button>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-left">
                <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Name</th>
                <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Email</th>
                <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Role</th>
                <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {team.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-slate-400">
                    No team members yet. Invite someone.
                  </td>
                </tr>
              )}
              {team.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                    {m.name}
                    {m.id === user?.id && (
                      <span className="ml-2 text-xs text-slate-400">(you)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{m.email}</td>
                  <td className="px-4 py-3">
                    {isAdmin && m.id !== user?.id ? (
                      <select
                        value={m.role}
                        disabled={updatingRole === m.id}
                        onChange={(e) => handleRoleChange(m.id, e.target.value)}
                        className="text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[m.role] ?? ROLE_COLORS.viewer}`}>
                        {ROLE_LABELS[m.role] ?? m.role}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="font-semibold text-slate-900 dark:text-white">Invite team member</h2>
              <button onClick={() => { setShowInvite(false); setInviteError(''); setInviteSuccess(''); }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleInvite} className="p-6 space-y-4">
              {inviteSuccess && (
                <p className="text-sm text-green-600 bg-green-50 dark:bg-green-950/30 px-3 py-2 rounded-lg">{inviteSuccess}</p>
              )}
              {inviteError && (
                <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">{inviteError}</p>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.ma"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowInvite(false)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                  Cancel
                </button>
                <button type="submit" disabled={inviteLoading}
                  className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold transition">
                  {inviteLoading ? 'Sending…' : 'Send invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
