# Project Monitor — TrackMa

**Author**: Project Monitor  
**Date**: 2026-06-22

---

## KPI Definitions

### Product KPIs

| KPI | Definition | How measured | Target |
|---|---|---|---|
| Registered orgs | Count of organizations with at least 1 active user | DB query: COUNT(organizations) | 200 by end Sprint 6 |
| Paying orgs | Orgs with active Stripe subscription (not trial) | DB: tier != 'trial' | 50 by launch |
| Trial → Paid conversion | % of trial orgs that upgrade to paid | (paying / all orgs) * 100 | > 15% |
| Monthly active orgs (MAO) | Orgs with at least 1 login in last 30 days | Auth logs | > 80% of paying orgs |
| Churn rate | % of paying orgs that cancel per month | Cancelled subscriptions / total | < 5%/month |
| MRR | Monthly Recurring Revenue in MAD | Sum of active subscription values | 50,000 MAD by month 3 |

### Technical KPIs

| KPI | Definition | Target |
|---|---|---|
| API p99 latency | 99th percentile response time | < 500ms |
| GPS ingestion lag | Time from device send to browser update | < 2 seconds |
| Uptime | % of time API responds 2xx | > 99.5% |
| Error rate | % of API calls returning 5xx | < 0.1% |
| Test coverage | Combined unit + integration | ≥ 80% |

### Sprint KPIs

| KPI | Definition | Target |
|---|---|---|
| Velocity | Story points completed per sprint | 35-45 pts |
| Sprint goal met | Sprint goal achieved (yes/no) | > 90% of sprints |
| Bug escape rate | Bugs found in prod per sprint | < 2/sprint |
| Deployment frequency | How often code is deployed | At least once per sprint |

---

## Sprint Health Metrics Template

Use this template at each sprint retrospective:

```
Sprint [N] — [DATE RANGE]
═══════════════════════════════════════════

Sprint Goal: [Goal description]
Goal Met: ✅ YES / ❌ NO

VELOCITY
  Committed: [X] pts
  Completed: [Y] pts
  Carry-over: [Z] pts
  Completion rate: [Y/X]%

QUALITY
  Bugs found in sprint: [N]
  Bugs fixed in sprint: [N]
  Test coverage: [N]%
  CI failures: [N]

BLOCKERS THIS SPRINT
  1. [Blocker description — resolved/unresolved]
  2. ...

WHAT WENT WELL
  - ...

WHAT TO IMPROVE
  - ...

NEXT SPRINT FOCUS: [1-sentence goal]
```

---

## Session Resumption (How to Resume Work)

When starting a new session after a break:

1. Check `.logs/sessions.md` — read the last `SESSION_END` entry
2. Check `docs/sprints/sprint-backlog.md` — find the current sprint and last incomplete story
3. Ask the user: "We were on Sprint [N], Story [X.Y]. Want to continue?"

---

## Logs Structure

```
track.ma/.logs/
├── sessions.md      — SESSION_START and SESSION_END entries per work session
├── activity.md      — What was done (task completions, milestones)
├── decisions.md     — Technical and product decisions made
├── issues.md        — Bugs, blockers, and their resolution
├── risks.md         — Risk register updates
├── corrections.md   — Plan changes, pivots, approach corrections
└── metrics.md       — Sprint velocity, coverage, KPI snapshots
```

---

## Monthly Status Report Template

```
TRACKMA STATUS REPORT — [MONTH YEAR]
══════════════════════════════════════════

SPRINT STATUS
  Current sprint: Sprint [N]
  Status: 🟢 On track / 🟡 At risk / 🔴 Off track
  Sprint goal: [description]

PRODUCT METRICS
  Registered orgs: [N] (target: [T])
  Paying orgs:     [N] (target: [T])
  Trial conversion: [N]% (target: >15%)
  MRR: [N] MAD (target: [T] MAD)
  Churn: [N]% (target: <5%)

TECHNICAL METRICS
  Uptime (30d): [N]%
  API p99: [N]ms
  Test coverage: [N]%
  Open bugs: [N] (critical: [N])

TOP 3 ACHIEVEMENTS THIS MONTH
  1. ...
  2. ...
  3. ...

TOP 3 RISKS
  1. [Risk] — [Status] — [Mitigation]
  2. ...
  3. ...

NEXT MONTH FOCUS
  ...
```
