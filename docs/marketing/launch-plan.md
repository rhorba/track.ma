# Go-to-Market Launch Plan — TrackMa

**Author**: Digital Marketer  
**Date**: 2026-06-22  
**Target Launch**: 2026-09-14 (Sprint 6 completion)

---

## Market Opportunity

### Morocco Fleet Management Market

- ~400,000 commercial vehicles registered in Morocco (source: MTPNET)
- Fleet management software penetration: estimated < 15%
- Dominant players: MIA Fleet (market leader), Samsara (expensive, Western-focused), local GPS resellers with basic web portals
- **Gap**: No modern, self-serve SaaS product with transparent pricing and instant setup

### TAM / SAM / SOM

| Level | Size | Notes |
|---|---|---|
| TAM | ~40,000 SME fleets | All Moroccan businesses with 2+ vehicles |
| SAM | ~8,000 fleets | Businesses with internet-savvy decision makers |
| SOM (Year 1) | 200 paying orgs | Realistic with limited marketing budget |

---

## Positioning

**Headline**: La gestion de flotte GPS au Maroc, enfin simple et transparente.

**Against MIA Fleet**:
| Dimension | MIA Fleet | TrackMa |
|---|---|---|
| Onboarding | Requires on-site visit | Self-serve in 30 minutes |
| Pricing | Quote-based, opaque | Published online, pay online |
| Trial | No public trial | Free trial, no credit card |
| Language | FR only | FR + AR |
| Mobile | Basic | Mobile-first design |

---

## Target Customer Segments

### Segment 1 — SME Logistics (primary)
- 5-50 vehicles (delivery, construction, food service)
- Decision maker: operations manager or business owner
- Pain: driver accountability, fuel theft, proving deliveries
- CAC target: 500 MAD
- LTV target (24 months): 19,200 MAD (Pro plan)

### Segment 2 — Individual Owners
- 1-2 vehicles, security-focused
- Decision maker: the individual
- Pain: theft prevention, parental monitoring
- CAC target: 100 MAD
- LTV target (12 months): 3,588 MAD (Starter plan)

### Segment 3 — Large Fleets (Phase 2)
- 50+ vehicles
- Decision maker: IT manager + CFO
- Custom demo + onboarding support required
- Approach after 6 months live

---

## Launch Phases

### Phase 0 — Pre-launch (2026-08-01 to 2026-09-13)

**Goal**: Build an audience before launch day.

Actions:
- [ ] Set up LinkedIn company page for TrackMa
- [ ] Create a waiting list landing page (`/early-access`)
- [ ] Post 4 LinkedIn articles about fleet management problems in Morocco
- [ ] DM 50 logistics/transport company decision makers on LinkedIn
- [ ] Partner outreach: 3 GPS hardware resellers (they can bundle our software)
- [ ] Set up Google Search Console and Analytics on the site

---

### Phase 1 — Launch Day (2026-09-14)

**Goal**: 50 sign-ups on day 1.

**Launch sequence**:

| Time | Action | Channel |
|---|---|---|
| 08:00 | Publish launch blog post | Blog |
| 09:00 | LinkedIn post: "We launched!" | LinkedIn |
| 09:30 | Email waiting list | Email |
| 10:00 | Post in Moroccan tech Facebook groups | Facebook |
| 12:00 | WhatsApp broadcast to beta testers | WhatsApp |
| 14:00 | Reply to all comments and DMs | All channels |
| 16:00 | Share launch metrics in real-time | LinkedIn Stories |

---

### Phase 2 — Growth (2026-09 to 2026-12)

**Goal**: 200 paying orgs by December 2026.

**Growth levers**:

1. **SEO** — Target keywords: "logiciel gestion flotte maroc", "suivi GPS voiture maroc", "traceur GPS professionnel maroc"
2. **Content** — 2 blog posts/month targeting the keyword list
3. **LinkedIn Ads** — Target: Morocco, job title = logistics manager / operations manager / business owner, B2B fleet companies
4. **WhatsApp Business** — Automated onboarding support via WhatsApp (Moroccan users prefer WhatsApp over email)
5. **Referral program** — 1 month free for each paying customer you refer (Sprint 7)
6. **Hardware bundling** — Partner with Teltonika device resellers for bundle deals

---

## SEO Strategy

### Target Keywords (priority order)

| Keyword (FR) | Keyword (AR) | Monthly searches | Difficulty |
|---|---|---|---|
| logiciel gestion flotte maroc | برنامج إدارة الأسطول المغرب | ~500 | Low |
| suivi GPS voiture maroc | تتبع GPS سيارة المغرب | ~1,200 | Low |
| traceur GPS professionnel | جهاز تتبع GPS احترافي | ~800 | Medium |
| gestion flotte transport | إدارة أسطول النقل | ~300 | Low |
| localisation vehicule maroc | تحديد موقع السيارة المغرب | ~600 | Low |

### On-page SEO checklist (Sprint 6)

- [ ] Landing page title tag: "TrackMa — Suivi GPS de Flotte au Maroc | Essai Gratuit"
- [ ] Meta description: 155 chars, includes primary keyword + CTA
- [ ] H1 matches primary keyword
- [ ] Alt text on all images (including map screenshots)
- [ ] Page speed: LCP < 2.5s (Core Web Vitals)
- [ ] Sitemap submitted to Google Search Console
- [ ] Schema markup: SoftwareApplication, Organization, FAQPage

---

## Analytics Setup

### Tools

- **Google Analytics 4**: pageviews, conversion events (register, add_vehicle, checkout)
- **Hotjar** (Sprint 7): heatmaps and session recordings to optimize onboarding flow
- **Google Search Console**: SEO performance tracking

### Key Conversion Events

```javascript
// Sign up
gtag('event', 'sign_up', { method: 'email', plan: 'trial' });

// First vehicle added
gtag('event', 'add_vehicle', { vehicle_type: type });

// Checkout initiated
gtag('event', 'begin_checkout', { value: price, currency: 'MAD' });

// Subscription activated
gtag('event', 'purchase', { value: price, currency: 'MAD', plan: tier });
```

### KPI Dashboard (weekly review)

| Metric | Target (Month 1) | Target (Month 3) |
|---|---|---|
| Monthly sign-ups | 100 | 400 |
| Trial → Paid conversion | > 15% | > 20% |
| Churn rate | < 5%/month | < 3%/month |
| CAC (paid channels) | < 500 MAD | < 350 MAD |
| MRR | 10,000 MAD | 50,000 MAD |

---

## Budget (Monthly)

| Channel | Budget/month (MAD) |
|---|---|
| LinkedIn Ads (B2B targeting) | 2,000 |
| Google Ads (keywords) | 1,500 |
| Content creation | 500 |
| WhatsApp Business API | 200 |
| **Total** | **4,200 MAD** |

Review and scale after month 2 based on CAC data.
