'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from '@/lib/api';

interface Vehicle {
  id: string;
  name: string;
  licensePlate: string;
  imei: string;
  make: string;
  model: string;
  year: number;
  status: string;
}

interface FormData {
  name: string;
  licensePlate: string;
  imei: string;
  make: string;
  model: string;
  year: string;
}

const EMPTY: FormData = { name: '', licensePlate: '', imei: '', make: '', model: '', year: '' };

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  idle: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  offline: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

export default function VehiclesPage() {
  const { data: vehicles = [], mutate } = useSWR<Vehicle[]>('vehicles', getVehicles);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openAdd = () => {
    setForm(EMPTY);
    setSelected(null);
    setModal('add');
  };

  const openEdit = (v: Vehicle) => {
    setForm({ name: v.name, licensePlate: v.licensePlate, imei: v.imei, make: v.make, model: v.model, year: String(v.year) });
    setSelected(v);
    setModal('edit');
  };

  const closeModal = () => { setModal(null); setSelected(null); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, year: Number(form.year) };
      if (modal === 'add') await createVehicle(payload);
      else if (selected) await updateVehicle(selected.id, payload);
      await mutate();
      closeModal();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteId(id);
    try {
      await deleteVehicle(id);
      await mutate();
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Véhicules</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {vehicles.length} enregistré{vehicles.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          + Ajouter un véhicule
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-left">
                <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Nom</th>
                <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Immatriculation</th>
                <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">IMEI</th>
                <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Marque / Modèle</th>
                <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Statut</th>
                <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {vehicles.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    Aucun véhicule. Ajoutez le premier.
                  </td>
                </tr>
              )}
              {vehicles.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{v.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-mono">{v.licensePlate}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">{v.imei}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{v.make} {v.model} {v.year}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[v.status] ?? STATUS_COLORS.offline}`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(v)}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium mr-4"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(v.id)}
                      disabled={deleteId === v.id}
                      className="text-red-500 hover:text-red-600 disabled:opacity-40"
                    >
                      {deleteId === v.id ? '…' : 'Supprimer'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="font-semibold text-slate-900 dark:text-white">
                {modal === 'add' ? 'Ajouter un véhicule' : 'Modifier le véhicule'}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {(
                [
                  ['name', 'Nom du véhicule', 'text', 'ex. Camion #1'],
                  ['licensePlate', 'Immatriculation', 'text', 'ex. 12345-A-7'],
                  ['imei', 'IMEI du boîtier GPS', 'text', 'IMEI à 15 chiffres'],
                  ['make', 'Marque', 'text', 'ex. Mercedes'],
                  ['model', 'Modèle', 'text', 'ex. Sprinter'],
                  ['year', 'Année', 'number', '2024'],
                ] as const
              ).map(([key, label, type, placeholder]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    {label}
                  </label>
                  <input
                    type={type}
                    required
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              ))}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                  Annuler
                </button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold transition">
                  {loading ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
