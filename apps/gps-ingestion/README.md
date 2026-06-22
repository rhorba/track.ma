# TrackMa — GPS Ingestion Service

Lightweight NestJS service that subscribes to MQTT topics, normalizes GPS telemetry from devices (Teltonika AVL + generic JSON), and publishes standardized position events to Redis pub/sub.

**Port**: 3002  
**No REST API** — this service communicates via MQTT (in) and Redis (out) only.

## Responsibility

```
MQTT Broker
    │
    │  trackma/devices/{imei}/position   (generic JSON)
    │  trackma/teltonika/{imei}           (Teltonika AVL JSON)
    ▼
GPS Ingestion Service
    │
    │  Normalize → GpsPosition
    ▼
Redis PUBLISH  gps:position
    │
    ▼
Core API (subscribes and handles storage + alerts)
```

## Running

```bash
# From monorepo root
pnpm --filter gps-ingestion dev

# Or directly
cd apps/gps-ingestion && pnpm start:dev
```

## Environment Variables

```env
REDIS_URL=redis://localhost:6379
MQTT_BROKER_URL=mqtt://localhost:1883
NODE_ENV=development
```

## MQTT Topics

| Topic | Format | Description |
|---|---|---|
| `trackma/devices/{imei}/position` | Generic JSON | Any GPS device |
| `trackma/teltonika/{imei}` | Teltonika AVL JSON | Teltonika FMB/FMT devices |

See [../../docs/gps-integration.md](../../docs/gps-integration.md) for full payload specs and device configuration.

## Testing

```bash
pnpm test
pnpm test:cov
```

## Simulating Messages

```bash
# Generic device
mosquitto_pub -h localhost -t "trackma/devices/TEST123/position" \
  -m '{"lat":33.5731,"lng":-7.5898,"speed":60,"heading":90,"ignition":true}'

# Teltonika device
mosquitto_pub -h localhost -t "trackma/teltonika/TEST456" \
  -m '{"timestamp":1750589400000,"lat":33573100,"lng":-7589800,"speed":60,"angle":90,"satellites":8,"altitude":145,"ioElements":{"239":1,"9":68}}'
```
