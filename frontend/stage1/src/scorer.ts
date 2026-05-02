/**
 * Scoring Strategy
 *
 * composite_score = TYPE_WEIGHT * RECENCY_SCALE + recency_seconds
 *
 * TYPE_WEIGHT:
 *   Placement → 3
 *   Result    → 2
 *   Event     → 1
 *
 * RECENCY_SCALE is chosen so that a Placement is always ranked above a Result
 * regardless of age difference — but within the same type, newer beats older.
 *
 * We set RECENCY_SCALE = 10_000_000_000 (10^10 seconds ≈ 317 years worth of
 * epoch seconds). This guarantees type dominates recency for any realistic data.
 *
 * recency_seconds = Unix epoch seconds of the notification timestamp.
 * Newer timestamps → larger epoch → higher recency_seconds → higher score.
 */

import { Notification, ScoredNotification } from "./types";

const TYPE_WEIGHT: Record<string, number> = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

const RECENCY_SCALE = 10_000_000_000;

export function score(notification: Notification): ScoredNotification {
  const typeWeight = TYPE_WEIGHT[notification.Type] ?? 0;
  const epochSeconds = Math.floor(
    new Date(notification.Timestamp).getTime() / 1000
  );
  const composite = typeWeight * RECENCY_SCALE + epochSeconds;

  return { notification, score: composite };
}
