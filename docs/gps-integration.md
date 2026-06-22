# GPS Device Integration — TrackMa

This guide explains how to connect GPS tracking devices to TrackMa via MQTT.

## Supported Protocols

| Protocol | Support | Notes |
|---|---|---|
| MQTT over TCP | ✅ Native | Primary protocol |
| MQTT over WebSocket | ✅ Native | Port 9001, for browser-based clients |
| Teltonika AVL (JSON) | ✅ Native | FMB, FMT, FMC series |
| Generic JSON | ✅ Native | Any device that can publish JSON |
| NMEA 0183 | Planned Sprint 3 | Raw GPS sentences |
| Teltonika binary TCP | Planned Sprint 3 | Raw AVL binary protocol |

## MQTT Broker

| Setting | Value |
|---|---|
| Host | your-server-ip or localhost in dev |
| Port | 1883 (TCP) / 9001 (WebSocket) |
| Authentication | None (dev) — configure in `infra/mosquitto/mosquitto.conf` for production |
| Protocol | MQTT v3.1.1 / v5 |

---

## Topic Schema

### Generic JSON Format

**Topic**: `trackma/devices/{imei}/position`

**Payload** (JSON):
```json
{
  "lat": 33.5731,
  "lng": -7.5898,
  "speed": 65,
  "heading": 270,
  "altitude": 145,
  "satellites": 9,
  "ignition": true,
  "fuelLevel": 68,
  "odometer": 124500,
  "timestamp": "2026-06-22T10:30:00.000Z"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `lat` | float | ✅ | Latitude (-90 to 90) |
| `lng` | float | ✅ | Longitude (-180 to 180) |
| `speed` | float | ✅ | Speed in km/h |
| `heading` | float | ✅ | Direction in degrees (0 = North) |
| `altitude` | float | ❌ | Altitude in meters |
| `satellites` | int | ❌ | Number of GPS satellites |
| `ignition` | bool | ❌ | Engine ignition state |
| `fuelLevel` | float | ❌ | Fuel level percentage (0–100) |
| `odometer` | int | ❌ | Total distance in meters |
| `timestamp` | ISO 8601 | ❌ | Device timestamp (server time used if absent) |

---

### Teltonika AVL Format

**Topic**: `trackma/teltonika/{imei}`

TrackMa expects Teltonika devices configured to publish parsed JSON (not raw binary) to MQTT. If your Teltonika device sends raw AVL binary over TCP, a protocol bridge is needed (planned for Sprint 3).

**Payload** (Teltonika parsed JSON):
```json
{
  "timestamp": 1750589400000,
  "priority": 0,
  "lat": 33573100,
  "lng": -7589800,
  "altitude": 145,
  "angle": 270,
  "satellites": 9,
  "speed": 65,
  "ioElements": {
    "239": 1,
    "9": 68,
    "16": 124500,
    "24": 0,
    "67": 12400
  }
}
```

**Teltonika IO Element IDs used by TrackMa**:

| IO ID | Name | Unit | Used for |
|---|---|---|---|
| 239 | Ignition | 0/1 | Ignition state |
| 9 | Analog Input 1 | mV | Fuel level (requires sensor calibration) |
| 16 | Total Odometer | m | Cumulative distance |
| 24 | Speed (CAN) | km/h | More accurate than GPS speed |
| 67 | Battery Voltage | mV | Device battery monitoring |
| 1 | Digital Input 1 | 0/1 | Custom input (door, PTO, etc.) |

> **Note**: Coordinates from Teltonika are in microdegrees (multiply by 0.000001 to get degrees). TrackMa handles this conversion automatically.

---

## Configuring a Teltonika Device (FMB920 Example)

1. Open **Teltonika Configurator**
2. Go to **System → MQTT**
3. Set:
   - **Broker URL**: `mqtt://your-server-ip:1883`
   - **Topic**: `trackma/teltonika/{device_imei}` (use `%s` for IMEI substitution in configurator)
   - **Message format**: JSON (not binary)
4. Go to **I/O** tab, enable the elements you need (Ignition = ID 239, Odometer = ID 16)
5. Set **Data Acquisition** to send on ignition change + every 30 seconds while moving

---

## Configuring a Generic GPRS Tracker

Most generic trackers (GT06, TK-103, etc.) can be configured via SMS:

```
# Set server address (replace with your MQTT bridge IP)
SERVER,0,your-server-ip,1883,0#

# Set GPRS APN (Maroc Telecom example)
APN,iam.ma#

# Set reporting interval (30 seconds)
TIMER,30#
```

For devices that don't support MQTT natively, a TCP-to-MQTT bridge is needed. This can be a small Node.js script that listens on a raw TCP port and republishes to MQTT in TrackMa's JSON format.

---

## Registering a Device in TrackMa

Once your device is sending MQTT messages, register it in the dashboard:

1. Go to **Vehicles → Add Vehicle**
2. Fill in vehicle details
3. Enter the device **IMEI** in the "Device IMEI" field
4. Save — TrackMa will automatically link incoming MQTT messages to this vehicle

The IMEI is the 15-digit identifier printed on the GPS device label. It also appears in MQTT topic: `trackma/devices/**123456789012345**/position`.

---

## Testing Device Connection

### Simulate a device from the command line

```bash
# Using mosquitto_pub (install: apt install mosquitto-clients)
mosquitto_pub -h localhost -p 1883 \
  -t "trackma/devices/123456789012345/position" \
  -m '{
    "lat": 33.5731,
    "lng": -7.5898,
    "speed": 60,
    "heading": 45,
    "ignition": true,
    "fuelLevel": 75,
    "timestamp": "2026-06-22T10:00:00Z"
  }'
```

### Monitor all incoming messages

```bash
mosquitto_sub -h localhost -p 1883 -t "trackma/#" -v
```

### Verify position was stored

```bash
# Check database
docker compose exec postgres psql -U trackma -d trackma \
  -c "SELECT lat, lng, speed, ignition, timestamp FROM positions ORDER BY timestamp DESC LIMIT 5;"

# Check Redis cache
docker compose exec redis redis-cli GET "vehicle:<vehicle-uuid>:latest"
```

---

## Production Security

In production, enable MQTT authentication in `infra/mosquitto/mosquitto.conf`:

```conf
allow_anonymous false
password_file /mosquitto/config/passwd

# TLS (recommended)
listener 8883
cafile /mosquitto/certs/ca.crt
certfile /mosquitto/certs/server.crt
keyfile /mosquitto/certs/server.key
require_certificate false
```

Create the password file:
```bash
mosquitto_passwd -c /path/to/passwd device_user
```

Each device should have its own MQTT credentials.
