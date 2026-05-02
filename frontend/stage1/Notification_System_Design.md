# Stage 1 — Notification System Design

## Overview

The Priority Inbox surfaces the **top K most important unread notifications** from a live API stream. It must remain correct as new notifications arrive continuously, without re-processing the full dataset on each arrival.

---

## Priority Scoring Model

Each notification receives a **composite score**:

```
composite_score = TYPE_WEIGHT × RECENCY_SCALE + epoch_seconds(Timestamp)
```

| Notification Type | TYPE_WEIGHT |
|---|---|
| Placement | 3 |
| Result | 2 |
| Event | 1 |

`RECENCY_SCALE = 10,000,000,000` (10¹⁰ seconds ≈ 317 years of epoch time)

### Why this formula?

- **Type always dominates recency**: The scale factor is large enough that a Placement will always outscore a Result or Event, regardless of how old it is vs. how new the other is. This preserves the strict `Placement > Result > Event` ordering required by the spec.
- **Within the same type, newer wins**: `epoch_seconds` is a monotonically increasing value — newer timestamps produce larger values — so recency is the natural tiebreaker within a type tier.
- **No floating point ambiguity**: All values are integers; no rounding errors.

---

## Data Structure: Min-Heap of Size K

A **bounded min-heap** of capacity K is used to track the top-K notifications.

### Invariant
The root of the heap always holds the **lowest-scoring item** in the current top-K set.

### Insertion Algorithm (O(log K))

```
function push(newItem):
  if heap.size < K:
    heap.insert(newItem)       // O(log K)
  elif newItem.score > heap.root.score:
    heap.root = newItem
    heap.siftDown(root)        // O(log K)
  else:
    discard newItem            // O(1)
```

### Why a Min-Heap (not Max-Heap)?

A min-heap lets us cheaply answer: "is this new notification better than the worst item in our current top-K?" The root gives us that worst item in O(1). If the new item beats it, we replace the root and restore the heap in O(log K). A max-heap would require scanning all K items to find the minimum — O(K).

---

## Complexity Analysis

| Operation | Time | Space |
|---|---|---|
| Initial batch of N notifications | O(N log K) | O(K) |
| Single new live arrival | O(log K) | O(1) |
| Extract top-K sorted | O(K log K) | O(K) |

For K=10 and N=10,000: the heap does at most 10 comparisons per notification vs. 10,000 comparisons for full re-sort.

---

## Continuous Arrival Strategy

When the system is running live (streaming mode):

1. The heap is **pre-seeded** with the initial batch processed during startup.
2. Each incoming notification is fed into `heap.push()` in O(log K).
3. The top-K is always available by calling `heap.drainSorted()` — no recomputation needed.
4. The heap never grows beyond K items — memory is bounded regardless of total notification volume.

This makes the system suitable for high-throughput environments where notifications arrive at high frequency (e.g., placement drives with thousands of concurrent applicants).

---

## File Structure

```
stage1/
├── src/
│   ├── index.ts          # Entry point — orchestrates fetch → score → heap → output
│   ├── api.ts            # Live API client (axios, pre-authorised headers)
│   ├── scorer.ts         # Composite score calculation
│   ├── priorityQueue.ts  # MinHeap<ScoredNotification> — bounded, O(log K) push
│   ├── logger.ts         # Custom Logging Middleware (replaces console.log)
│   └── types.ts          # Shared TypeScript interfaces
├── Notification_System_Design.md
├── package.json
└── tsconfig.json
```

---

## Logging Middleware

All output goes through the custom `logger` module (`src/logger.ts`). It emits structured log lines:

```
[ISO-timestamp] [LEVEL] [context] message | data={...}
```

`console.log` is never used — all application output (including the formatted top-K table) is written directly to `process.stdout` as presentation output, while all structured logs go through the logger.

---

## API Integration

- **Endpoint:** `GET http://20.207.122.201/evaluation-service/notifications`
- **Auth:** Pre-authorised `Authorization: Bearer pre-authorised` header per spec (no login flow)
- **Error handling:** Axios errors are caught, logged via `logger.error`, and re-thrown to exit cleanly with a non-zero status code
- **Timeout:** 10 seconds to avoid indefinite hangs

---

## Efficiency Summary

| Concern | Approach |
|---|---|
| Memory | Heap capped at K — O(K) regardless of N |
| CPU (batch) | O(N log K) — sub-linear in K compared to O(N log N) full sort |
| CPU (streaming) | O(log K) per arrival — constant with respect to N |
| Correctness | Composite score guarantees `Placement > Result > Event` with recency tiebreak |
| Robustness | API errors logged and surfaced; graceful empty-result handling |
