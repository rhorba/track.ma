import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'track.ma — Suivi GPS de flotte en temps réel au Maroc',
  description:
    'track.ma est la solution de gestion de flotte GPS pour les entreprises marocaines. Suivi en temps réel, alertes, rapports, géofencing. Essai gratuit 14 jours.',
  alternates: {
    canonical: 'https://trackma.ma',
  },
  openGraph: {
    title: 'track.ma — Suivi GPS de flotte en temps réel au Maroc',
    description:
      'Gérez votre flotte avec track.ma : positions en temps réel, alertes vitesse/zone, rapports de trajets. Plans à partir de 299 MAD/mois.',
    url: 'https://trackma.ma',
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <Contact />
      <Footer />
    </div>
  );
}

/* ─── Nav ─────────────────────────────────────────────────────────────────── */
function Nav() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-slate-950/80 backdrop-blur border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <span className="text-xl font-bold text-emerald-400 tracking-tight">track.ma</span>
        <nav className="hidden md:flex items-center gap-8 text-sm text-slate-400">
          <a href="#fonctionnalites" className="hover:text-slate-100 transition-colors">Fonctionnalités</a>
          <a href="#comment" className="hover:text-slate-100 transition-colors">Comment ça marche</a>
          <a href="#tarifs" className="hover:text-slate-100 transition-colors">Tarifs</a>
          <a href="#contact" className="hover:text-slate-100 transition-colors">Contact</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-slate-300 hover:text-white transition-colors">
            Connexion
          </Link>
          <Link
            href="/register"
            className="text-sm bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Essayer gratuitement
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ─── Hero ─────────────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm px-4 py-1.5 rounded-full mb-8">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          Suivi GPS en temps réel
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
          Gérez votre flotte
          <span className="text-emerald-400"> intelligemment</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          track.ma est la plateforme de gestion de flotte conçue pour les entreprises marocaines.
          Suivez vos véhicules en direct, recevez des alertes instantanées et optimisez vos coûts.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-3.5 rounded-xl font-semibold text-base transition-colors"
          >
            Essayez gratuitement — 30 jours
          </Link>
          <Link
            href="/demo"
            className="border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white px-8 py-3.5 rounded-xl font-semibold text-base transition-colors"
          >
            Voir la démo live
          </Link>
        </div>
        <p className="text-sm text-slate-500 mt-4">Aucune carte bancaire requise · Annulation à tout moment</p>

        {/* Dashboard preview placeholder */}
        <div className="mt-16 relative">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <div className="flex-1 bg-slate-800 rounded h-5 mx-4" />
            </div>
            <div className="grid grid-cols-4 gap-3 mb-4">
              {['12 Véhicules actifs', '1 482 km aujourd\'hui', '3 Alertes', '94 L consommés'].map((s) => (
                <div key={s} className="bg-slate-800 rounded-lg p-3 text-left">
                  <div className="text-xs text-slate-500 mb-1">{s.split(' ').slice(1).join(' ')}</div>
                  <div className="text-lg font-bold text-white">{s.split(' ')[0]}</div>
                </div>
              ))}
            </div>
            <div className="bg-slate-800 rounded-xl h-48 flex items-center justify-center">
              <span className="text-slate-600 text-sm">Carte GPS en direct · Casablanca, Maroc</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Features ─────────────────────────────────────────────────────────────── */
const features = [
  {
    icon: '📍',
    title: 'Suivi en temps réel',
    desc: 'Visualisez tous vos véhicules sur une carte live. Positions actualisées toutes les secondes via GPS et MQTT.',
  },
  {
    icon: '🔔',
    title: 'Alertes intelligentes',
    desc: "Recevez des notifications instantanées : excès de vitesse, entrée/sortie de zone, allumage, carburant bas.",
  },
  {
    icon: '🗺️',
    title: 'Géofences',
    desc: 'Dessinez des zones géographiques sur la carte et soyez alerté dès qu\'un véhicule les franchit.',
  },
  {
    icon: '📊',
    title: 'Rapports & Trajets',
    desc: 'Historique complet des trajets, kilométrage, consommation carburant et export CSV pour la comptabilité.',
  },
];

function Features() {
  return (
    <section id="fonctionnalites" className="py-24 px-6 bg-slate-900/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Tout ce dont votre flotte a besoin
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Une plateforme complète, pensée pour les réalités du marché marocain.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-emerald-500/30 transition-colors"
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── How It Works ─────────────────────────────────────────────────────────── */
const steps = [
  {
    num: '01',
    title: 'Ajoutez vos véhicules',
    desc: 'Enregistrez vos véhicules avec leur IMEI GPS. Compatible Teltonika et traceurs JSON génériques.',
  },
  {
    num: '02',
    title: 'Connectez vos traceurs',
    desc: 'Vos boîtiers GPS envoient les données via MQTT. La connexion prend moins de 5 minutes.',
  },
  {
    num: '03',
    title: 'Pilotez en temps réel',
    desc: 'Tableau de bord live, alertes automatiques, rapports mensuels — tout sur une seule plateforme.',
  },
];

function HowItWorks() {
  return (
    <section id="comment" className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Opérationnel en 5 minutes
          </h2>
          <p className="text-slate-400 text-lg">Aucune compétence technique requise.</p>
        </div>
        <div className="space-y-8">
          {steps.map((s, i) => (
            <div key={s.num} className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 font-bold text-sm">
                {s.num}
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg mb-1">{s.title}</h3>
                <p className="text-slate-400">{s.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="absolute left-6 mt-12 w-px h-8 bg-slate-800 hidden" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Pricing ──────────────────────────────────────────────────────────────── */
const plans = [
  {
    name: 'Démarrage',
    price: 'Gratuit',
    period: '30 jours',
    vehicles: '3 véhicules',
    features: ['Suivi GPS en direct', 'Alertes basiques', 'Historique 7 jours', 'Support email'],
    cta: 'Commencer gratuitement',
    href: '/register?plan=trial',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '299 MAD',
    period: '/ mois',
    vehicles: '10 véhicules',
    features: ['Tout Démarrage +', 'Géofences illimitées', 'Historique 90 jours', 'Alertes email & SMS', 'Export CSV', 'Support prioritaire'],
    cta: 'Choisir Pro',
    href: '/register?plan=starter',
    highlight: true,
  },
  {
    name: 'Entreprise',
    price: '799 MAD',
    period: '/ mois',
    vehicles: '50 véhicules',
    features: ['Tout Pro +', 'Véhicules illimités', 'Historique 1 an', 'API accès complet', 'Multi-administrateurs', 'SLA 99,9%', 'Onboarding dédié'],
    cta: 'Choisir Entreprise',
    href: '/register?plan=pro',
    highlight: false,
  },
];

function Pricing() {
  return (
    <section id="tarifs" className="py-24 px-6 bg-slate-900/50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Des tarifs transparents en MAD
          </h2>
          <p className="text-slate-400 text-lg">Sans frais cachés. Sans engagement annuel forcé.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl p-6 border flex flex-col ${
                p.highlight
                  ? 'bg-emerald-500/5 border-emerald-500/40'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              {p.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Le plus populaire
                </div>
              )}
              <div className="mb-6">
                <div className="text-slate-400 text-sm mb-1">{p.name}</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">{p.price}</span>
                  <span className="text-slate-400 text-sm">{p.period}</span>
                </div>
                <div className="text-emerald-400 text-sm mt-1">{p.vehicles}</div>
              </div>
              <ul className="space-y-2.5 mb-8 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={p.href}
                className={`block text-center py-3 rounded-xl font-semibold text-sm transition-colors ${
                  p.highlight
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
                    : 'border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white'
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Contact ──────────────────────────────────────────────────────────────── */
function Contact() {
  return (
    <section id="contact" className="py-24 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Des questions ?
        </h2>
        <p className="text-slate-400 text-lg mb-8">
          Notre équipe est disponible du lundi au vendredi, 9h–18h (GMT+1).
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <a
            href="mailto:contact@track.ma"
            className="bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl p-5 text-left transition-colors block"
          >
            <div className="text-2xl mb-2">✉️</div>
            <div className="text-white font-medium mb-1">Email</div>
            <div className="text-slate-400 text-sm">contact@track.ma</div>
          </a>
          <a
            href="https://wa.me/212600000000"
            className="bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl p-5 text-left transition-colors block"
          >
            <div className="text-2xl mb-2">💬</div>
            <div className="text-white font-medium mb-1">WhatsApp</div>
            <div className="text-slate-400 text-sm">+212 6 00 00 00 00</div>
          </a>
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ───────────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="border-t border-slate-800 py-8 px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-emerald-400 font-bold">track.ma</span>
        <p className="text-slate-500 text-sm">
          © {new Date().getFullYear()} track.ma — Tous droits réservés
        </p>
        <div className="flex gap-6 text-sm text-slate-500">
          <Link href="/login" className="hover:text-slate-300 transition-colors">Connexion</Link>
          <Link href="/register" className="hover:text-slate-300 transition-colors">Inscription</Link>
          <Link href="/demo" className="hover:text-slate-300 transition-colors">Démo</Link>
        </div>
      </div>
    </footer>
  );
}
