export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl font-bold mb-6">
        T
      </div>
      <h1 className="text-2xl font-semibold mb-2">Vous êtes hors ligne</h1>
      <p className="text-slate-400 mb-2">أنت غير متصل بالإنترنت</p>
      <p className="text-sm text-slate-500 max-w-sm mt-4">
        Reconnectez-vous pour accéder à votre tableau de bord en temps réel.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-8 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold transition-colors"
      >
        Réessayer
      </button>
    </div>
  );
}
