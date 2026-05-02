/**
 * AffordMed Campus Notifications — Stage 1
 * Priority Inbox: surfaces the top K most important unread notifications
 * using a MinHeap of size K for O(N log K) processing and O(log K) per
 * streaming/continuous arrival.
 */

import { fetchNotifications } from "./api";
import { logger } from "./logger";
import { MinHeap } from "./priorityQueue";
import { score } from "./scorer";
import { ScoredNotification } from "./types";

const CTX = "priority-inbox";
const TOP_K = 10;

/** Simulates continuous notification arrivals by streaming a batch. */
function streamNotifications(
  heap: MinHeap,
  notifications: ReturnType<typeof score>[]
): void {
  logger.info(CTX, `Streaming ${notifications.length} notifications into heap`, {
    capacity: TOP_K,
  });

  for (const scored of notifications) {
    heap.push(scored);
    logger.debug(CTX, "Processed notification", {
      id: scored.notification.ID,
      type: scored.notification.Type,
      score: scored.score,
      heapSize: heap.size,
    });
  }
}

function printTopK(topK: ScoredNotification[]): void {
  const divider = "─".repeat(80);
  process.stdout.write(`\n${divider}\n`);
  process.stdout.write(`  AffordMed — Priority Inbox  (Top ${TOP_K} Notifications)\n`);
  process.stdout.write(`${divider}\n\n`);

  topK.forEach((item, i) => {
    const { ID, Type, Message, Timestamp } = item.notification;
    process.stdout.write(
      `  #${String(i + 1).padStart(2, "0")}  [${Type.toUpperCase().padEnd(9)}]  ${Timestamp}  (score: ${item.score})\n`
    );
    process.stdout.write(`        ID: ${ID}\n`);
    process.stdout.write(`        ${Message}\n\n`);
  });

  process.stdout.write(`${divider}\n`);
}

async function main(): Promise<void> {
  logger.info(CTX, "AffordMed Priority Inbox starting", { topK: TOP_K });

  const raw = await fetchNotifications();

  if (raw.length === 0) {
    logger.warn(CTX, "No notifications returned from API");
    return;
  }

  logger.info(CTX, `Scoring ${raw.length} notifications`);
  const scored = raw.map(score);

  // Build the top-K heap — O(N log K)
  const heap = new MinHeap(TOP_K);
  streamNotifications(heap, scored);

  const topK = heap.drainSorted();
  logger.info(CTX, `Top-${TOP_K} computed`, { returned: topK.length });

  printTopK(topK);

  // ── Continuous-arrival simulation ──────────────────────────────────────────
  // Demonstrate that new notifications can be fed into the heap one-at-a-time
  // (O(log K) per arrival) without re-processing the full set.
  logger.info(CTX, "Simulating 3 new live notifications arriving...");

  const liveArrivals = [
    {
      ID: "live-001",
      Type: "Placement" as const,
      Message: "LIVE: Google SDE Internship opening — apply by midnight!",
      Timestamp: new Date().toISOString().replace("Z", ""),
    },
    {
      ID: "live-002",
      Type: "Event" as const,
      Message: "LIVE: Alumni panel in Main Auditorium at 5 PM",
      Timestamp: new Date(Date.now() - 60_000).toISOString().replace("Z", ""),
    },
    {
      ID: "live-003",
      Type: "Result" as const,
      Message: "LIVE: B.Tech Sem-6 results published on portal",
      Timestamp: new Date(Date.now() - 120_000).toISOString().replace("Z", ""),
    },
  ];

  const liveHeap = new MinHeap(TOP_K);
  // Re-seed with existing top-K
  topK.forEach((s) => liveHeap.push(s));
  // Feed live arrivals O(log K) each
  liveArrivals.forEach((n) => liveHeap.push(score(n)));

  const updatedTopK = liveHeap.drainSorted();
  logger.info(CTX, "Updated top-K after live arrivals", { returned: updatedTopK.length });

  process.stdout.write("\n\n  ── After 3 live arrivals ──\n");
  printTopK(updatedTopK);
}

main().catch((err) => {
  logger.error(CTX, "Unhandled error in main", { message: (err as Error).message });
  process.exit(1);
});
