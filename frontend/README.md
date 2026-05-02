# AffordMed — Campus Notifications Microservice

**Campus Hiring Evaluation Submission**
Repo: `VaibhavNaiyar/AffordMed` · Branch: `main` · Path: `frontend/`

---

## Repository Structure

```
frontend/
├── stage1/                        # Stage 1 — Priority Inbox Algorithm (TypeScript)
│   ├── src/
│   │   ├── index.ts               # Entry point — orchestrates fetch → score → heap → output
│   │   ├── api.ts                 # Live API client (axios, fallback to evaluation data)
│   │   ├── scorer.ts              # Composite priority score formula
│   │   ├── priorityQueue.ts       # MinHeap<ScoredNotification> — O(log K) per insertion
│   │   ├── logger.ts              # Custom Logging Middleware
│   │   └── types.ts               # Shared TypeScript interfaces
│   ├── Notification_System_Design.md
│   ├── package.json
│   └── tsconfig.json
│
├── stage2/                        # Stage 2 — React/Next.js Frontend
│   ├── app/
│   │   ├── all-notifications/     # All Notifications page (paginated, filterable)
│   │   └── priority-inbox/        # Priority Inbox page (top-N, MinHeap ranked)
│   ├── components/
│   │   ├── NavBar.tsx             # Responsive navigation bar
│   │   ├── NotificationCard.tsx   # Card with read/unread toggle, type chip, NEW badge
│   │   └── ThemeRegistry.tsx      # MUI theme provider
│   ├── lib/
│   │   ├── api.ts                 # API client with fallback data
│   │   ├── logger.ts              # Custom Logging Middleware
│   │   ├── priorityQueue.ts       # MinHeap getTopK() — shared algorithm
│   │   ├── theme.ts               # MUI theme configuration
│   │   └── types.ts               # Shared TypeScript interfaces
│   ├── outputVideo/
│   │   └── rg314Output.mp4        # Output recording (desktop + mobile views)
│   └── package.json
│
└── .gitignore
```

---

## Stage 1 — Priority Inbox Algorithm

### Setup & Run

```bash
cd frontend/stage1
npm install
npm run dev
```

### What it does

- Fetches live notifications from the evaluation API
- Scores each notification using a composite formula:
  `score = TYPE_WEIGHT × 10,000,000,000 + epoch_seconds(Timestamp)`
- Type weights: `Placement = 3 > Result = 2 > Event = 1`
- Maintains a **min-heap of size K** (default 10) — O(N log K) for batch, O(log K) per live arrival
- Prints the ranked top-10 table, then simulates 3 live arrivals and prints the updated top-10

### Viewing the Output

> Screenshots of the top-10 output are in **`stage1/`** (added separately to the repo).

---

## Stage 2 — React/Next.js Frontend

### Tech Stack

- **Next.js 16** (App Router)
- **Material UI (MUI)** — only styling library used
- **TypeScript**
- Custom Logging Middleware (no `console.log` anywhere)

### Setup & Run

```bash
cd frontend/stage2
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — redirects automatically to the All Notifications page.

### Pages

| Route | Description |
|---|---|
| `/all-notifications` | All notifications — paginated (5/10/20 per page), filter by type (Placement / Result / Event), visual NEW vs viewed distinction, auto-refreshes every 30s |
| `/priority-inbox` | Top-N notifications ranked by MinHeap algorithm — configurable N (10/15/20), filter by type, score display, stats bar |

### Features

- **Read/Unread toggle** — click the mail icon on any card to mark as read or unread
- **NEW badge** — unread notifications show a red NEW chip and bold text
- **Type colour coding** — Placement (green), Result (amber), Event (blue) with left border accent
- **Responsive** — mobile hamburger menu, desktop nav buttons; tested at all breakpoints
- **Error handling** — API failures show a warning banner; falls back to evaluation sample data
- **Logging** — every API call, filter change, page navigation, and heap computation is logged via the custom logger

### Viewing the Output Video

The output recording (desktop + mobile walkthrough) is at:

```
frontend/stage2/outputVideo/rg314Output.mp4
```

> **GitHub cannot preview `.mp4` files above ~10 MB.**
> To watch the video:
> 1. Navigate to `frontend/stage2/outputVideo/rg314Output.mp4` on GitHub
> 2. Click **"View raw"** (or the **Raw** button at the top right)
> 3. The file will download — open it locally in any media player

---

## Cross-Cutting Constraints Met

| Constraint | How |
|---|---|
| Custom Logging Middleware | `lib/logger.ts` (Stage 2) / `src/logger.ts` (Stage 1) — all logs routed here |
| No `console.log` | Enforced across both stages |
| No user login | All users pre-authorised; no auth flow |
| Frequent commits | See git log — committed incrementally by feature |
| Real runnable code | No pseudo-code; both stages fully executable |

---

## API Reference

```
GET http://20.207.122.201/evaluation-service/notifications
  ?limit=10
  &page=1
  &notification_type=Placement | Result | Event
```

Response shape:

```json
{
  "notifications": [
    {
      "ID": "uuid",
      "Type": "Placement | Result | Event",
      "Message": "string",
      "Timestamp": "2026-04-22T17:51:30"
    }
  ]
}
```
