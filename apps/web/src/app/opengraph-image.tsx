import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'track.ma — Suivi GPS de flotte en temps réel';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          padding: '64px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #2563eb 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Logo mark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              fontWeight: 700,
              color: '#fff',
            }}
          >
            T
          </div>
          <span style={{ fontSize: '40px', fontWeight: 700, color: '#fff', letterSpacing: '-1px' }}>
            track.ma
          </span>
        </div>

        {/* Tagline */}
        <p
          style={{
            fontSize: '52px',
            fontWeight: 700,
            color: '#fff',
            margin: '0 0 16px 0',
            lineHeight: 1.15,
          }}
        >
          Suivi GPS de flotte
          <br />
          en temps réel
        </p>
        <p
          style={{
            fontSize: '24px',
            color: '#93c5fd',
            margin: 0,
          }}
        >
          Alertes intelligentes · Rapports · Géofencing · Pour le Maroc
        </p>
      </div>
    ),
    { ...size },
  );
}
