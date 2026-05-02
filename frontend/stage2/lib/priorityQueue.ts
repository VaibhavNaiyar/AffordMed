import { Notification, ScoredNotification } from "./types";

const TYPE_WEIGHT: Record<string, number> = {
  Placement: 3,
  Result: 2,
  Event: 1,
};
const RECENCY_SCALE = 10_000_000_000;

export function scoreNotification(n: Notification): ScoredNotification {
  const typeWeight  = TYPE_WEIGHT[n.Type] ?? 0;
  const epochSec    = Math.floor(new Date(n.Timestamp).getTime() / 1000);
  return { notification: n, score: typeWeight * RECENCY_SCALE + epochSec };
}

class MinHeap {
  private heap: ScoredNotification[] = [];
  private cap: number;

  constructor(cap: number) { this.cap = cap; }

  get size() { return this.heap.length; }

  push(item: ScoredNotification) {
    if (this.heap.length < this.cap) {
      this.heap.push(item);
      this.bubbleUp(this.heap.length - 1);
    } else if (item.score > this.heap[0].score) {
      this.heap[0] = item;
      this.siftDown(0);
    }
  }

  drainSorted(): ScoredNotification[] {
    const copy = [...this.heap];
    const result: ScoredNotification[] = [];
    while (copy.length > 0) {
      result.push(copy[0]);
      copy[0] = copy[copy.length - 1];
      copy.pop();
      let i = 0;
      while (true) {
        let s = i, l = 2*i+1, r = 2*i+2;
        if (l < copy.length && copy[l].score < copy[s].score) s = l;
        if (r < copy.length && copy[r].score < copy[s].score) s = r;
        if (s === i) break;
        [copy[s], copy[i]] = [copy[i], copy[s]];
        i = s;
      }
    }
    return result.reverse();
  }

  private bubbleUp(i: number) {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.heap[p].score <= this.heap[i].score) break;
      [this.heap[p], this.heap[i]] = [this.heap[i], this.heap[p]];
      i = p;
    }
  }

  private siftDown(i: number) {
    const n = this.heap.length;
    while (true) {
      let s = i, l = 2*i+1, r = 2*i+2;
      if (l < n && this.heap[l].score < this.heap[s].score) s = l;
      if (r < n && this.heap[r].score < this.heap[s].score) s = r;
      if (s === i) break;
      [this.heap[s], this.heap[i]] = [this.heap[i], this.heap[s]];
      i = s;
    }
  }
}

export function getTopK(notifications: Notification[], k: number): ScoredNotification[] {
  const heap = new MinHeap(k);
  for (const n of notifications) heap.push(scoreNotification(n));
  return heap.drainSorted();
}
