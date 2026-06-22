# Risk Register — TrackMa

**Last updated**: 2026-06-22  
**Owner**: Mohamed Rhorba

Risk scoring: **Probability** (1=Low, 2=Medium, 3=High) × **Impact** (1=Low, 2=Medium, 3=High) = **Score**

---

## Active Risks

### R01 — GPS Device MQTT Compatibility
| Field | Value |
|---|---|
| **Description** | Target GPS devices (Teltonika FMB/FMT series) may not support MQTT natively and require raw TCP binary AVL parsing |
| **Probability** | 2 (Medium) |
| **Impact** | 3 (High) |
| **Score** | 6 🔴 |
| **Mitigation** | Sprint 2: test with real Teltonika device or simulator; implement TCP binary parser as fallback in Sprint 3 |
| **Contingency** | Provide TCP-to-MQTT bridge script as stop-gap; document alternative config for Teltonika Configurator |
| **Status** | Open |

---

### R02 — Solo Developer Timeline Slippage
| Field | Value |
|---|---|
| **Description** | 3-month timeline with a single developer; unexpected complexity in GPS pipeline or alert engine could push sprint deadlines |
| **Probability** | 2 (Medium) |
| **Impact** | 2 (Medium) |
| **Score** | 4 🟡 |
| **Mitigation** | CTS framework enforces YAGNI; scope cuts clearly defined (Out of Scope list in charter); Sprint 6 has buffer tasks that can be deferred |
| **Contingency** | Cut demo mode (Sprint 6) and FR/AR bilingual UI (Sprint 5) as first scope reductions if behind |
| **Status** | Open |

---

### R03 — Stripe MAD Payout / Account Restrictions
| Field | Value |
|---|---|
| **Description** | Stripe may restrict payouts to Moroccan bank accounts or require additional business documentation |
| **Probability** | 1 (Low) |
| **Impact** | 3 (High) |
| **Score** | 3 🟡 |
| **Mitigation** | Verify Stripe Morocco payout eligibility before Sprint 5; prepare alternative (PayDunya, CMI) |
| **Contingency** | Integrate CMI (Crédit du Maroc Interbank) as secondary payment gateway |
| **Status** | Open — verify in Sprint 4 |

---

### R04 — PostgreSQL Position Table Performance at Scale
| Field | Value |
|---|---|
| **Description** | The `positions` table accumulates millions of rows quickly (100 devices × 1 ping/30s = 288k rows/day). Queries may slow without proper indexing |
| **Probability** | 1 (Low) |
| **Impact** | 2 (Medium) |
| **Score** | 2 🟢 |
| **Mitigation** | Composite index `(vehicle_id, timestamp)` already in place; Sprint 6 adds PostgreSQL EXPLAIN audit |
| **Contingency** | Add TimescaleDB hypertable or partition by month in Sprint 6 |
| **Status** | Open |

---

### R05 — OpenStreetMap Tile Availability / Rate Limiting
| Field | Value |
|---|---|
| **Description** | OpenStreetMap's free tile servers have a usage policy; high traffic could result in rate limiting or blocking |
| **Probability** | 1 (Low) |
| **Impact** | 2 (Medium) |
| **Score** | 2 🟢 |
| **Mitigation** | For MVP traffic levels, OSM tiles are fine; add tile caching headers via nginx |
| **Contingency** | Switch to self-hosted tiles (OpenMapTiles + nginx) or MapTiler free tier |
| **Status** | Open |

---

### R06 — CNDP Data Protection Compliance
| Field | Value |
|---|---|
| **Description** | TrackMa tracks individuals' locations; Morocco's CNDP requires declaration for systems processing personal data including GPS coordinates |
| **Probability** | 2 (Medium) |
| **Impact** | 2 (Medium) |
| **Score** | 4 🟡 |
| **Mitigation** | Sprint 6: add Privacy Policy page, Terms of Service, CNDP declaration reference; encrypt position data at rest |
| **Contingency** | Consult CNDP website (cndp.ma) before public launch; add data deletion endpoint for GDPR-equivalent compliance |
| **Status** | Open — address in Sprint 6 |

---

### R07 — Gmail SMTP Deliverability
| Field | Value |
|---|---|
| **Description** | Gmail SMTP with an App Password may have daily sending limits (500/day) or deliverability issues for alert emails |
| **Probability** | 1 (Low) |
| **Impact** | 1 (Low) |
| **Score** | 1 🟢 |
| **Mitigation** | Acceptable for MVP; alerts are triggered on events, not bulk emails |
| **Contingency** | Switch to Resend or Brevo (free tier: 300 emails/day) in Sprint 4 |
| **Status** | Open |

---

## Closed Risks

| ID | Description | Resolution | Date |
|---|---|---|---|
| — | — | — | — |

---

## Risk Matrix

```
Impact
  3 │  R03        R01
    │
  2 │  R06  R04  R02
    │             R05
  1 │  R07
    └─────────────────
       1     2     3   Probability
```

Legend: 🔴 Score 6+ (High) | 🟡 Score 3–5 (Medium) | 🟢 Score 1–2 (Low)
